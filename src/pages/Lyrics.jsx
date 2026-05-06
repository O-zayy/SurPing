import { useState, useEffect, useRef } from 'react';
import Axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Play, Pause, AlertCircle, Copy, Check, Download, FileText } from 'lucide-react';
import { WordsPullUp } from '../components/WordsPullUp';
import GlassSurface from '../components/GlassSurface';
import VariableProximity from '../components/VariableProximity';
import ElasticSlider from '../components/ElasticSlider';
import './Lyrics.css';

const decodeHtml = (value = "") => {
  if (!value) return "";
  if (typeof document === "undefined") {
    return String(value)
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const stripParenthetical = (value = "") => value.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");

const normalizeText = (value = "") => stripParenthetical(decodeHtml(String(value)))
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const getSongTitle = (song) => decodeHtml(song?.title || song?.song || "");

const getPrimaryArtist = (song) => decodeHtml(
  song?.primary_artists || song?.singers || song?.music || ""
).split(",")[0].trim();

const getArtworkUrl = (image = "") => {
  if (Array.isArray(image)) {
    return image[image.length - 1]?.url || image[0]?.url || "";
  }

  return String(image || "")
    .replace("50x50", "500x500")
    .replace("150x150", "500x500")
    .replace("250x250", "500x500");
};

const getSongDuration = (song) => {
  const rawDuration = Number(song?.duration || song?.duration_seconds);
  return Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : null;
};

const getLineTime = (line, scale = 1) => line.time * scale;

const getActiveLyricIndex = (lines, time, scale = 1) => {
  if (!lines.length) return -1;

  let activeIndex = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (time < getLineTime(lines[i], scale)) break;
    activeIndex = i;
  }

  return activeIndex;
};

const isStrongLrcMatch = (match, song) => {
  const songTitle = normalizeText(getSongTitle(song));
  const songArtist = normalizeText(getPrimaryArtist(song));
  const songDuration = getSongDuration(song);
  const matchTitle = normalizeText(match.trackName || match.name || "");
  const matchArtist = normalizeText(match.artistName || "");
  const matchDuration = Number(match.duration);

  const titleMatches = songTitle && (
    matchTitle === songTitle ||
    matchTitle.includes(songTitle) ||
    songTitle.includes(matchTitle)
  );
  const artistMatches = songArtist && matchArtist.includes(songArtist);
  const durationMatches = songDuration && Number.isFinite(matchDuration)
    ? Math.abs(songDuration - matchDuration) <= 15
    : true;

  return Boolean(match.syncedLyrics && titleMatches && artistMatches && durationMatches && !match.instrumental);
};

const scoreLrcMatch = (match, song) => {
  const songTitle = normalizeText(getSongTitle(song));
  const songArtist = normalizeText(getPrimaryArtist(song));
  const songAlbum = normalizeText(song?.album || "");
  const matchTitle = normalizeText(match.trackName || match.name || "");
  const matchArtist = normalizeText(match.artistName || "");
  const matchAlbum = normalizeText(match.albumName || "");
  const songDuration = getSongDuration(song);
  const matchDuration = Number(match.duration);

  let score = 0;

  if (match.syncedLyrics) {
    const lineCount = match.syncedLyrics.split('\n').filter(Boolean).length;
    score += 100 + Math.min(lineCount, 150); // reward lyrics with more lines
  }
  if (match.plainLyrics) score += 10;
  if (songTitle && matchTitle === songTitle) score += 70;
  else if (songTitle && matchTitle.includes(songTitle)) score += 45;
  else if (songTitle && songTitle.includes(matchTitle)) score += 25;

  if (songArtist && matchArtist.includes(songArtist)) score += 45;
  if (songAlbum && matchAlbum.includes(songAlbum)) score += 20;

  if (songDuration && Number.isFinite(matchDuration)) {
    const durationGap = Math.abs(songDuration - matchDuration);
    if (durationGap <= 2) score += 30;
    else if (durationGap <= 12) score += 15;
    else score -= Math.min(45, durationGap);
  }

  if (match.instrumental) score -= 60;

  return score;
};

// Cursor-tracking gradient helper
const handleGlow = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
};

export default function Lyrics() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedSong, setSelectedSong] = useState(null);
  const [error, setError] = useState("");
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  // Lyrics State
  const [plainLyrics, setPlainLyrics] = useState("");
  const [syncedLyrics, setSyncedLyrics] = useState([]); 
  const [lyricSourceDuration, setLyricSourceDuration] = useState(null);
  
  // Audio State
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Scroll State
  const lyricsContainerRef = useRef(null);
  const activeLineRef = useRef(null);
  const dropdownRef = useRef(null);

  // Action button states
  const [copied, setCopied] = useState(false);
  const errorContainerRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  const artworkUrl = getArtworkUrl(selectedSong?.image);
  const rawLyricScale = duration && lyricSourceDuration ? duration / lyricSourceDuration : 1;
  const lyricTimeScale = rawLyricScale > 0.85 && rawLyricScale < 1.15 ? rawLyricScale : 1;
  const activeLyricIndex = getActiveLyricIndex(syncedLyrics, currentTime, lyricTimeScale);
  const plainLyricLines = plainLyrics.split('\n').map((line) => line.trim()).filter(Boolean);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add body class for lyrics page (used to hide navbar logo on mobile)
  useEffect(() => {
    document.body.classList.add('page-lyrics');
    return () => document.body.classList.remove('page-lyrics');
  }, []);

  // Debounced Search for Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        setIsSearching(false);
        setResults([]);
        setShowDropdown(false);
        return;
      }

      if (query.trim().length > 2) {
        setIsSearching(true);
        Axios.get(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}`)
          .then(res => {
            if (Array.isArray(res.data)) {
              setResults(res.data.slice(0, 5));
              setShowDropdown(true);
            }
          })
          .catch(err => console.error("Search error:", err))
          .finally(() => setIsSearching(false));
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Immediate search on Enter key
  const handleEnterSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // If results already exist, pick the first one
    if (results.length > 0) {
      fetchLyrics(results[0]);
      return;
    }

    // Otherwise do an immediate search
    try {
      setIsSearching(true);
      const res = await Axios.get(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(trimmed)}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setResults(res.data.slice(0, 5));
        fetchLyrics(res.data[0]);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // LRC Parser
  const parseLrc = (lrcString) => {
    const parsed = [];

    lrcString.split('\n').forEach((line) => {
      const timestamps = [...line.matchAll(/\[(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const text = decodeHtml(line.replace(/\[(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, "")).trim();

      if (!timestamps.length || !text) return;

      timestamps.forEach((timestamp) => {
        const hours = Number(timestamp[1] || 0);
        const minutes = Number(timestamp[2] || 0);
        const seconds = Number(timestamp[3] || 0);
        const fraction = timestamp[4] ? Number(`0.${timestamp[4].padEnd(3, "0").slice(0, 3)}`) : 0;

        parsed.push({
          time: hours * 3600 + minutes * 60 + seconds + fraction,
          text
        });
      });
    });

    return parsed
      .filter((line) => Number.isFinite(line.time))
      .sort((a, b) => a.time - b.time);
  };

  const applyPlainLyrics = (lyrics) => {
    const cleanLyrics = decodeHtml(lyrics || "");

    setPlainLyrics(cleanLyrics);
    setSyncedLyrics([]);
    setLyricSourceDuration(null);
  };

  const applyLyricMatch = (match) => {
    if (!match) return false;

    if (match.syncedLyrics) {
      const parsed = parseLrc(match.syncedLyrics);

      if (parsed.length > 0) {
        setPlainLyrics(match.plainLyrics || "");
        setSyncedLyrics(parsed);
        setLyricSourceDuration(Number(match.duration) || null);
        return true;
      }
    }

    return false;
  };

  // Fetch Lyrics (Synced or Plain)
  const fetchLyrics = async (song) => {
    if (!song) return;
    
    setSelectedSong(song);
    const cleanTitle = getSongTitle(song);
    const artist = getPrimaryArtist(song);
    const album = decodeHtml(song.album || "");
    const songDuration = getSongDuration(song);

    skipNextSearchRef.current = true;
    setQuery(cleanTitle);
    setShowDropdown(false);
    setLoadingLyrics(true);
    setPlainLyrics("");
    setSyncedLyrics([]);
    setLyricSourceDuration(null);
    setError("");
    
    // Reset Audio
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    try {
      // 1. Use both strict and broad LrcLib search concurrently to guarantee we get the best possible match pools.
      const lrcParams = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: artist
      });
      if (album) lrcParams.set("album_name", album);
      if (songDuration) lrcParams.set("duration", String(Math.round(songDuration)));

      const [strictRes, broadRes] = await Promise.allSettled([
        Axios.get(`https://lrclib.net/api/search?${lrcParams.toString()}`, { timeout: 12000 }),
        Axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${cleanTitle}`)}`, { timeout: 12000 })
      ]);
      
      let allMatches = [];
      if (strictRes.status === 'fulfilled' && Array.isArray(strictRes.value.data)) {
        allMatches.push(...strictRes.value.data);
      }
      if (broadRes.status === 'fulfilled' && Array.isArray(broadRes.value.data)) {
        allMatches.push(...broadRes.value.data);
      }

      // Deduplicate by ID
      const uniqueMatchesMap = new Map();
      allMatches.forEach(m => uniqueMatchesMap.set(m.id, m));
      allMatches = Array.from(uniqueMatchesMap.values());

      if (allMatches.length > 0) {
        let bestMatch = allMatches
          .filter((match) => isStrongLrcMatch(match, song))
          .sort((a, b) => scoreLrcMatch(b, song) - scoreLrcMatch(a, song))[0];

        if (!bestMatch) {
          const sortedScored = allMatches
            .filter((m) => m.syncedLyrics && !m.instrumental)
            .sort((a, b) => scoreLrcMatch(b, song) - scoreLrcMatch(a, song));
          if (sortedScored.length > 0 && scoreLrcMatch(sortedScored[0], song) > 50) {
            bestMatch = sortedScored[0];
          }
        }

        if (applyLyricMatch(bestMatch)) {
          setLoadingLyrics(false);
          return;
        }
      }
    } catch (e) {
      console.warn("LrcLib search failed, trying fallback...", e.message);
    }

    try {
      // 2. Fallback to JioSaavn API (Plain Text)
      const saavnRes = await Axios.get(`https://saavnapi-nine.vercel.app/lyrics/?query=${song.id}`, { timeout: 4000 });
      if (saavnRes.data && saavnRes.data.lyrics) {
        const formattedLyrics = saavnRes.data.lyrics.replace(/<br\s*\/?>/gi, "\n");
        applyPlainLyrics(formattedLyrics);
        setLoadingLyrics(false);
        return;
      }
    } catch (e) {
      console.warn("JioSaavn lyrics failed or timed out.", e.message);
    }

    // 3. Absolute Fallback: lyrics.ovh
    try {
      const ovhRes = await Axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`, { timeout: 4000 });
      if (ovhRes.data && ovhRes.data.lyrics) {
        applyPlainLyrics(ovhRes.data.lyrics);
        setLoadingLyrics(false);
        return;
      }
    } catch(e) {
      console.warn("lyrics.ovh failed.", e.message);
    }

    setError("Sometimes ,write your own lyrics");
    setLoadingLyrics(false);
  };

  // Auto-scroll to active lyric (Custom logic to prevent window scrolling)
  useEffect(() => {
    if (activeLyricIndex >= 0 && activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const element = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      
      container.scrollTo({
        top: elementTop - (containerHeight / 2) + (elementHeight / 2),
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex, syncedLyrics.length]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    let frameId;
    const updateClock = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime || 0);
      }
      frameId = requestAnimationFrame(updateClock);
    };

    frameId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  // Audio Controls
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch (e) {
        console.error("Playback failed", e);
      }
    } else {
      audio.pause();
    }
  };

  const handleSeek = (newTime) => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleLoadedMetadata = (e) => {
    const nextDuration = e.target.duration;
    setDuration(nextDuration);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Keyboard controls
  useEffect(() => {
    if (!selectedSong) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in the search bar
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
          setCurrentTime(audioRef.current.currentTime);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current && duration) {
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
          setCurrentTime(audioRef.current.currentTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSong, duration]);

  // Autoplay when song is selected
  useEffect(() => {
    if (selectedSong && !loadingLyrics) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        togglePlay();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedSong, loadingLyrics]);

  return (
    <div className="lyrics-page relative min-h-screen bg-[#121212] font-sans text-white overflow-x-hidden md:overflow-hidden flex flex-col">
      
      {/* Dynamic Background */}
      <AnimatePresence mode="wait">
        {selectedSong ? (
          <motion.div 
            key="album-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-0"
          >
            <img 
              src={artworkUrl} 
              alt="Album Blur"
              className="absolute inset-0 w-full h-full object-cover blur-[100px] scale-125 opacity-40 saturate-[2]" 
            />
            <div className="absolute inset-0 bg-black/50 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none z-0"></div>
          </motion.div>
        ) : (
          <motion.video 
            key="video-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
            className="fixed inset-0 w-full h-full object-cover z-0 opacity-40"
            autoPlay
            loop
            muted
            playsInline
          />
        )}
      </AnimatePresence>

      <div 
        className={`lyrics-search absolute left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedSong || showDropdown ? 'top-24 px-4 md:top-28 md:px-8' : 'top-[55%] sm:top-[60%] md:top-1/2 mt-4 sm:mt-12 px-4 sm:px-6 md:mt-24'
        }`}
      >
        <motion.div 
          className={`relative flex flex-col w-full pointer-events-auto transition-all ${
            selectedSong ? 'max-w-[360px] md:max-w-[420px]' : 'max-w-xl'
          }`}
          ref={dropdownRef}
        >
          {selectedSong ? (
            <div onMouseMove={handleGlow} className="cursor-glow cursor-glow-wide w-full flex items-center bg-black/20 backdrop-blur-3xl saturate-150 border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-5 transition-all outline-none focus-within:bg-black/30 focus-within:border-white/20 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.1)]" style={{ height: 52 }}>
              <Search size={18} className="text-white/80 mr-4 flex-shrink-0" />
              <input 
                className="w-full min-w-0 bg-transparent border-none outline-none text-white placeholder-white/80 font-medium text-sm md:text-base"
                type="text" 
                placeholder="Search for a song or artist..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length > 2 && results.length > 0 && setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEnterSearch();
                  }
                }}
              />
              {isSearching && <Loader2 size={18} className="text-white/80 ml-4 animate-spin" />}
            </div>
          ) : (
            <GlassSurface 
              onMouseMove={handleGlow}
              width="100%"
              height={64}
              borderRadius={32}
              className="cursor-glow cursor-glow-wide flex items-center transition-all px-6 py-4 shadow-2xl"
              style={{ padding: 0 }}
            >
              <div className="flex w-full h-full px-5 items-center bg-transparent">
                <Search size={20} className="text-white/80 mr-4 flex-shrink-0" />
                <input 
                  className="w-full min-w-0 bg-transparent border-none outline-none text-white placeholder-white/80 font-medium text-base sm:text-lg"
                  type="text" 
                  placeholder="Search for a song or artist..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.length > 2 && results.length > 0 && setShowDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEnterSearch();
                    }
                  }}
                />
                {isSearching && <Loader2 size={18} className="text-white/80 ml-4 animate-spin" />}
              </div>
            </GlassSurface>
          )}

          <AnimatePresence>
            {showDropdown && results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-3 z-50 rounded-2xl overflow-hidden shadow-2xl"
              >
                {selectedSong ? (
                  <div className="flex flex-col w-full bg-black/20 backdrop-blur-3xl saturate-150 border border-white/10 rounded-2xl max-h-[400px] overflow-y-auto no-scrollbar shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                    {results.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => fetchLyrics(song)}
                        onMouseMove={handleGlow}
                        className="cursor-glow w-full text-left flex items-center gap-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-none px-4 py-3"
                      >
                        <img src={getArtworkUrl(song.image)} alt="Thumbnail" className="w-12 h-12 rounded-md object-cover shadow-md" />
                        <div className="flex flex-col">
                          <span className="text-white font-bold line-clamp-1" dangerouslySetInnerHTML={{ __html: song.title || song.song }}></span>
                          <span className="text-white/70 text-sm line-clamp-1" dangerouslySetInnerHTML={{ __html: song.singers }}></span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <GlassSurface
                    width="100%"
                    height="auto"
                    borderRadius={16}
                    className="flex flex-col"
                    style={{ padding: 0, alignItems: 'stretch' }}
                  >
                    <div className="flex flex-col w-full h-full max-h-[400px] overflow-y-auto no-scrollbar">
                      {results.map((song) => (
                        <button
                          key={song.id}
                          onClick={() => fetchLyrics(song)}
                          onMouseMove={handleGlow}
                          className="cursor-glow w-full text-left flex items-center gap-4 hover:bg-white/10 transition-colors border-b border-white/10 last:border-none px-6 py-4"
                        >
                          <img src={getArtworkUrl(song.image)} alt="Thumbnail" className="w-12 h-12 rounded-md object-cover shadow-md" />
                          <div className="flex flex-col">
                            <span className="text-white font-bold line-clamp-1" dangerouslySetInnerHTML={{ __html: song.title || song.song }}></span>
                            <span className="text-white/70 text-sm line-clamp-1" dangerouslySetInnerHTML={{ __html: song.singers }}></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </GlassSurface>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col w-full min-h-screen pb-8">
        
        {/* Loading State */}
        {loadingLyrics && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Loader2 size={48} className="text-white animate-spin drop-shadow-2xl" />
            <span className="text-white/70 text-xl tracking-widest uppercase font-semibold">Decrypting Audio...</span>
          </div>
        )}

{/* Error State (Only when no song is selected) */}
          {error && !loadingLyrics && !selectedSong && (
          <div ref={errorContainerRef} className="flex-1 flex flex-col items-center justify-center gap-4 relative w-full">
              <AlertCircle size={48} className="text-[#e1e9e5] mb-4" />
              <VariableProximity
                label={error}
                className="text-[#e1e9e5] text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-md text-center cursor-default"
              radius={120}
              falloff="linear"
            />
          </div>
        )}

        {/* Initial Hero View (Before Search) */}
        {!selectedSong && !loadingLyrics && !error && (
          <div className={`flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 min-h-[calc(100svh-200px)] -mt-10 transition-opacity duration-500 ${showDropdown ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <WordsPullUp 
              text="Lyrics Finder" 
              className="text-4xl sm:text-6xl md:text-8xl lg:text-[120px] font-bold leading-[0.9] text-white mb-6 drop-shadow-2xl"
              showAsterisk={true}
            />
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/70 text-base sm:text-lg md:text-2xl max-w-[17rem] sm:max-w-3xl mx-auto font-light drop-shadow-md"
            >
              Immersive, full-screen karaoke playback powered by JioSaavn and LrcLib.
            </motion.p>
          </div>
        )}

        {/* Apple Music Style Two-Column View */}
        {!loadingLyrics && selectedSong && (
          <div className="lyrics-player-layout relative w-full pt-36 pb-10 px-4 sm:px-6 md:fixed md:inset-0 md:pt-32 md:pb-8 md:px-12 lg:px-24 flex items-start md:items-center justify-center pointer-events-none z-10 overflow-x-hidden md:overflow-hidden">
            <div className="w-full max-w-[1400px] flex flex-col md:flex-row items-center md:items-stretch justify-start md:justify-between gap-8 md:gap-12 lg:gap-24 pointer-events-auto h-auto md:h-full md:max-h-[85vh]">
              
                {/* LEFT COLUMN: PLAYER */}
              <div className="w-full md:w-1/2 max-w-[500px] flex flex-col items-center md:items-stretch justify-center gap-6 md:gap-8 h-auto md:h-full py-4 md:py-8 shrink min-h-0">
                
                {/* Massive Album Art */}
                <motion.div 
                  onClick={togglePlay}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="lyrics-album-art self-center flex-none rounded-[28px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] bg-white/5 ring-1 ring-white/10 cursor-pointer group relative"
                >
                  <img src={artworkUrl} alt="Cover" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlaying ? <Pause size={64} className="text-white drop-shadow-lg" /> : <Play size={64} className="text-white drop-shadow-lg ml-2" />}
                  </div>
                </motion.div>

                {/* Title & Controls */}
                <div className="flex flex-col gap-6 md:gap-8 w-full">
                  
                  <div className="flex flex-col gap-2 text-center md:text-left">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white line-clamp-1" dangerouslySetInnerHTML={{ __html: selectedSong.title || selectedSong.song }}></h2>
                    <span className="text-base sm:text-xl md:text-2xl text-white/60 font-medium line-clamp-1" dangerouslySetInnerHTML={{ __html: selectedSong.singers }}></span>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Seek Bar */}
                    <ElasticSlider
                      startingValue={0}
                      value={currentTime}
                      maxValue={duration || 100}
                      onChange={handleSeek}
                      leftIcon={(
                        <span className="text-sm text-white font-mono tracking-wider w-12 text-right opacity-90 select-none">
                          {formatTime(currentTime)}
                        </span>
                      )}
                      rightIcon={(
                        <span className="text-sm text-white font-mono tracking-wider w-12 text-left opacity-90 select-none">
                          {formatTime(duration)}
                        </span>
                      )}
                    />

                    {/* Play Button + Action Buttons in one row */}
                    <div className="flex items-center justify-center gap-3 md:gap-6 w-full max-w-[400px] mx-auto py-2">

                      {/* Left Group */}
                      <div className="flex-1 flex items-center justify-end gap-3">
                        {/* Copy Lyrics */}
                        {(plainLyrics || syncedLyrics.length > 0) && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            title={copied ? "Copied!" : "Copy Lyrics"}
                            onClick={async () => {
                              const text = syncedLyrics.length > 0
                                ? syncedLyrics.map(l => l.text).join('\n')
                                : plainLyrics;
                              try {
                                await navigator.clipboard.writeText(text);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }}
                            onMouseMove={handleGlow}
                            className="cursor-glow cursor-glow-sm w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-white/80 flex items-center justify-center transition-all hover:bg-white/20 hover:border-white/25 hover:text-white cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0"
                          >
                            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                          </motion.button>
                        )}

                        {/* Download MP3 */}
                        {selectedSong.media_url && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            title="Download MP3"
                            onClick={async () => {
                              try {
                                const songName = `${decodeHtml(getSongTitle(selectedSong))} - ${decodeHtml(getPrimaryArtist(selectedSong))}`;
                                const response = await fetch(selectedSong.media_url);
                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${songName}.mp3`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error('Download failed:', err);
                                window.open(selectedSong.media_url, '_blank');
                              }
                            }}
                            onMouseMove={handleGlow}
                            className="cursor-glow cursor-glow-sm w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-white/80 flex items-center justify-center transition-all hover:bg-white/20 hover:border-white/25 hover:text-white cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0"
                          >
                            <Download size={18} />
                          </motion.button>
                        )}
                      </div>

                      {/* Main Play/Pause Button */}
                      <div className="flex-shrink-0">
                        <button 
                          onClick={togglePlay} 
                          onMouseMove={handleGlow}
                          className="cursor-glow cursor-glow-sm w-18 h-18 md:w-24 md:h-24 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]"
                        >
                          {isPlaying ? <Pause size={36} className="fill-black" /> : <Play size={36} className="fill-black ml-1.5" />}
                        </button>
                      </div>

                      {/* Right Group */}
                      <div className="flex-1 flex items-center justify-start gap-3">
                        {/* Download Lyrics as TXT */}
                        {(plainLyrics || syncedLyrics.length > 0) && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            title="Download Lyrics (.txt)"
                            onClick={() => {
                              const songName = `${decodeHtml(getSongTitle(selectedSong))} - ${decodeHtml(getPrimaryArtist(selectedSong))}`;
                              const text = syncedLyrics.length > 0
                                ? syncedLyrics.map(l => l.text).join('\n')
                                : plainLyrics;
                              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${songName} - Lyrics.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            onMouseMove={handleGlow}
                            className="cursor-glow cursor-glow-sm w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-white/80 flex items-center justify-center transition-all hover:bg-white/20 hover:border-white/25 hover:text-white cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0"
                          >
                            <FileText size={18} />
                          </motion.button>
                        )}
                      </div>

                    </div>

                  </div>

                </div>

                {/* Hidden Audio Element */}
                {selectedSong.media_url && (
                  <audio 
                    ref={audioRef} 
                    src={selectedSong.media_url} 
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} 
                    onLoadedMetadata={handleLoadedMetadata} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                )}
              </div>

              {/* RIGHT COLUMN: LYRICS */}
              <div 
                ref={lyricsContainerRef}
                className="lyrics-scroll-panel w-full md:w-1/2 h-[55svh] min-h-[360px] md:h-full md:min-h-0 overflow-y-auto no-scrollbar scroll-smooth relative"
                style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}
              >
                <div className="w-full flex flex-col items-start gap-6 md:gap-8 py-[28vh] md:py-[40vh] px-2 sm:px-4 md:pl-12 md:pr-0">
                
                {syncedLyrics.length > 0 ? (
                  syncedLyrics.map((line, i) => {
                    const isActive = i === activeLyricIndex;

                    return (
                      <p 
                        key={i} 
                        ref={isActive ? activeLineRef : null} 
                        className={`transition-all duration-[600ms] ease-out cursor-pointer origin-left text-left w-full ${
                          isActive 
                            ? 'text-3xl sm:text-4xl md:text-[56px] lg:text-[64px] font-bold text-white leading-tight scale-100 opacity-100 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]' 
                            : 'text-2xl sm:text-3xl md:text-[44px] lg:text-[52px] font-bold text-white/40 leading-tight scale-95 opacity-50 hover:text-white/70 hover:opacity-100'
                        }`}
                        onClick={() => {
                          if (audioRef.current) {
                            const seekTime = Math.max(0, getLineTime(line, lyricTimeScale));
                            audioRef.current.currentTime = duration ? Math.min(duration, seekTime) : seekTime;
                            setCurrentTime(audioRef.current.currentTime);
                            if (audioRef.current.paused) togglePlay();
                          }
                        }}
                      >
                        {line.text}
                      </p>
                    )
                  })
                ) : plainLyricLines.length > 0 ? (
                  plainLyricLines.map((line, i) => (
                    <p 
                      key={i}
                      className="text-2xl sm:text-3xl md:text-[44px] lg:text-[52px] font-bold text-white/80 leading-tight text-left w-full"
                    >
                      {line}
                    </p>
                  ))
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-8 relative w-full pt-[10vh] pr-4">
                      <AlertCircle size={48} className="text-[#e1e9e5] opacity-80" />
                      <div ref={errorContainerRef} className="w-full flex justify-center pb-20">
                        <VariableProximity
                          label={error}
                          className="text-[#e1e9e5] text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold drop-shadow-lg text-left w-full cursor-default leading-[1.1] opacity-90"
                          fromFontVariationSettings="'wght' 400, 'opsz' 9"
                          toFontVariationSettings="'wght' 1000, 'opsz' 40"
                          containerRef={errorContainerRef}
                          radius={160}
                          falloff="linear"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          )}

      </div>
    </div>
  );
}
