import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { gsap } from 'gsap';
import ojaswaImg from '/src/assets/OJASWA CHAUHAN.png';
import adityaImg from '/src/assets/ADITYA SRIVASTAVA.png';
import shubhamImg from '/src/assets/SHUBHAM MAKKAR.png';
import './LandingPage.css';

const FadingVideo = ({ src, className, style }) => {
  const videoRef = useRef(null);
  const fadingOutRef = useRef(false);
  const fadeRAF = useRef(null);

  const fadeTo = (targetOpacity) => {
    if (!videoRef.current) return;
    const duration = 500;
    const start = performance.now();
    const initialOpacity = parseFloat(videoRef.current.style.opacity) || 0;

    const animateFade = (time) => {
      let timeFraction = (time - start) / duration;
      if (timeFraction > 1) timeFraction = 1;

      const currentOpacity = initialOpacity + (targetOpacity - initialOpacity) * timeFraction;
      if (videoRef.current) {
        videoRef.current.style.opacity = currentOpacity;
      }

      if (timeFraction < 1) {
        fadeRAF.current = requestAnimationFrame(animateFade);
      }
    };

    if (fadeRAF.current) cancelAnimationFrame(fadeRAF.current);
    fadeRAF.current = requestAnimationFrame(animateFade);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.style.opacity = 0;
      video.play().catch(e => console.log(e));
      fadeTo(1);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const timeLeft = video.duration - video.currentTime;
      if (!fadingOutRef.current && timeLeft <= 0.55 && timeLeft > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const handleEnded = () => {
      video.style.opacity = 0;
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(e => console.log(e));
          fadingOutRef.current = false;
          fadeTo(1);
        }
      }, 100);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Initial trigger just in case
    if (video.readyState >= 3) {
      handleLoadedData();
    }

    return () => {
      if (fadeRAF.current) cancelAnimationFrame(fadeRAF.current);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
};

const BlurText = ({ text, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={isInView ? {
            filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y: [50, -5, 0]
          } : {}}
          transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeOut', delay: (i * 100) / 1000 }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};

export default function LandingPage() {
  // Suppress specific framer motion benign errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning: Each child in a list should have a unique "key" prop.')) {
        return; // Suppress list key warnings
      }
      originalError.call(console, ...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  const cardsRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      '.profile-card',
      { opacity: 0 },
      {
        opacity: 1,
        stagger: 0.08,
        ease: 'elastic.out(1, 0.5)',
        delay: 1
      }
    );
  }, []);

  return (
    <div className="home-page bg-black text-white min-h-screen font-body overflow-x-hidden">
      {/* Hero Section */}
      <section className="home-hero relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />
        <div className="home-hero-shade" />

        <div className="home-hero-content relative z-10 flex-1 flex flex-col items-center justify-center pt-28 px-4 w-full">
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="home-kicker liquid-glass rounded-full px-1 py-1 pr-4 flex items-center gap-3 mb-8"
          >
            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">SurPing</span>
            <span className="text-sm text-white/90">Play, listen, trace, and create from one sleek space</span>
          </motion.div>

          <BlurText
            text="A sharper way to explore your web tools"
            className="home-title text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.86] max-w-4xl justify-center text-center"
          />

          <motion.p
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            className="mt-6 text-sm md:text-base text-white/80 max-w-2xl font-light leading-relaxed text-center"
          >
            SurPing brings immersive lyrics, fast QR creation, signal lookup, and a polished ping pong arena into a premium glass interface built to feel smooth on every screen.
          </motion.p>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 1.1 }}
            className="flex items-center gap-6 mt-8"
          >
            <Link to="/lyrics" className="home-cta liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center hover:bg-white/10 transition-colors">
              Launch Lyrics
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
              </svg>
            </Link>
            <Link to="/ping-pong" className="flex items-center text-sm font-medium hover:text-white/80 transition-colors">
              Play Ping Pong
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 1.3 }}
            className="home-stat-grid flex flex-wrap items-stretch justify-center gap-4 mt-12"
          >
            <div className="home-stat liquid-glass p-5 w-[220px] max-w-full rounded-[1.25rem] flex flex-col justify-between">
              <svg className="h-7 w-7 text-white mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-heading italic text-4xl leading-none text-white">4</div>
                <div className="text-xs text-white/70 font-light mt-2">Premium Tools</div>
              </div>
            </div>
            <div className="home-stat liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between">
              <svg className="h-7 w-7 text-white mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-heading italic text-4xl leading-none text-white">Live</div>
                <div className="text-xs text-white/70 font-light mt-2">Responsive Experience</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1.4 }}
          className="relative z-10 flex flex-col items-center gap-5 pb-8 w-full mt-auto"
        >
          <div className="home-powered liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white/80">
            Built around motion, glass, readable contrast, and mobile-first flow
          </div>
          <div className="home-tool-strip flex flex-wrap justify-center font-heading italic text-white/60 text-2xl md:text-3xl gap-8 md:gap-16">
            <span>Lyrics</span>
            <span className="opacity-50">·</span>
            <span>Ping Pong</span>
            <span className="opacity-50">·</span>
            <span>QR Code</span>
            <span className="opacity-50">·</span>
            <span>IP Locator</span>
            <span className="opacity-50">·</span>
            <span>SurPing</span>
          </div>
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section className="relative w-full min-h-screen flex flex-col">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="home-feature-wrap relative z-10 px-5 sm:px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen flex-1">
          <div className="mb-auto">
            <div className="text-sm text-white/60 mb-6 font-medium tracking-wide uppercase">// Features</div>
            <h2 className="home-section-title font-heading italic text-white text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] leading-[0.9]">
              Smooth tools<br />for quick moves
            </h2>
          </div>

          <div className="home-feature-grid grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pb-8">
            {/* Card 1 */}
            <div className="home-feature-card liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Synced Lyrics</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Real-time</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Interactive</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Karaoke</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl leading-none">Lyrics Studio</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">
                  Search music, play audio, copy lyrics, and follow synced lines in a focused full-screen player.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="home-feature-card liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Hold Controls</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Physics</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Scores</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Arcade</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl leading-none">Ping Pong Arena</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">A neon game surface with smoother serves, live paddle control, and a responsive arcade layout.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="home-feature-card liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Signal Trace</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">QR Build</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Readable</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Fast</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl leading-none">Utility Layer</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">
                  Generate QR codes and reveal IP location details through high-contrast cards that stay clear on mobile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="crew-section relative w-full min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 md:px-16 lg:px-20 py-24">
        <div className="text-sm text-white/60 mb-6 font-medium tracking-wide uppercase">// Our Team</div>
        <h2 className="crew-title font-heading italic text-white text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] mb-16">
          Meet the Crew
        </h2>
        <div ref={cardsRef} className="crew-grid grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[112rem]">
          <ProfileCard
            className="profile-card crew-profile-card"
            name="Ojaswa Chauahan"
            title="Team Leader"
            handle="ojaswa"
            status="Leading the Vision"
            avatarUrl={ojaswaImg}
            contactText="Connect"
            onContactClick={() => window.open('https://www.linkedin.com/in/ojaswa-chauhan-812261381/', '_blank')}
            behindGlowEnabled={true}
            behindGlowColor="rgba(111, 255, 0, 0.34)"
            innerGradient="linear-gradient(145deg, #1f4a1f8c 0%, #6fff0044 100%)"
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={true}
          />
          <ProfileCard
            className="profile-card crew-profile-card"
            name="Aditya Srivastava"
            title="Developer"
            handle="aditya"
            status="Building Features"
            avatarUrl={adityaImg}
            contactText="Connect"
            onContactClick={() => window.open('https://www.linkedin.com/in/aditya-srivastava-41753a35a/', '_blank')}
            behindGlowEnabled={true}
            behindGlowColor="rgba(125, 190, 255, 0.46)"
            innerGradient="linear-gradient(145deg, #1f3a5f8c 0%, #7dbeff44 100%)"
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={true}
          />
          <ProfileCard
            className="profile-card crew-profile-card"
            name="Shubham Makkar"
            title="Developer"
            handle="shubham"
            status="Crafting Code"
            avatarUrl={shubhamImg}
            contactText="Connect"
            onContactClick={() => window.open('https://www.linkedin.com/in/shubham-makkar06/', '_blank')}
            behindGlowEnabled={true}
            behindGlowColor="rgba(255, 255, 255, 0.32)"
            innerGradient="linear-gradient(145deg, #3a3a3a8c 0%, #ffffff44 100%)"
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={true}
          />
        </div>
      </section>
    </div>
  );
}
