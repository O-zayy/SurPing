import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

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

  return (
    <div className="bg-black text-white min-h-screen font-body overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 px-4 w-full">
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="liquid-glass rounded-full px-1 py-1 pr-4 flex items-center gap-3 mb-8"
          >
            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">New</span>
            <span className="text-sm text-white/90">Maiden Crewed Voyage to Mars Arrives 2026</span>
          </motion.div>

          <BlurText
            text="Venture Past Our Sky Across the Universe"
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl justify-center tracking-[-4px] text-center"
          />

          <motion.p
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            className="mt-6 text-sm md:text-base text-white/80 max-w-2xl font-light leading-tight text-center"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 1.1 }}
            className="flex items-center gap-6 mt-8"
          >
            <Link to="/qr-code" className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center hover:bg-white/10 transition-colors">
              Start Your Voyage
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
              </svg>
            </Link>
            <button className="flex items-center text-sm font-medium hover:text-white/80 transition-colors">
              View Liftoff
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </button>
          </motion.div>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 1.3 }}
            className="flex items-stretch gap-4 mt-12"
          >
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between">
              <svg className="h-7 w-7 text-white mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-heading italic text-4xl tracking-[-1px] leading-none text-white">34.5 Min</div>
                <div className="text-xs text-white/70 font-light mt-2">Average Videos Watch Time</div>
              </div>
            </div>
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between">
              <svg className="h-7 w-7 text-white mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-heading italic text-4xl tracking-[-1px] leading-none text-white">2.8B+</div>
                <div className="text-xs text-white/70 font-light mt-2">Users Across the Globe</div>
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
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white/80">
            Collaborating with top aerospace pioneers globally
          </div>
          <div className="flex flex-wrap justify-center font-heading italic text-white/60 text-2xl md:text-3xl tracking-tight gap-8 md:gap-16">
            <span>Aeon</span>
            <span className="opacity-50">·</span>
            <span>Vela</span>
            <span className="opacity-50">·</span>
            <span>Apex</span>
            <span className="opacity-50">·</span>
            <span>Orbit</span>
            <span className="opacity-50">·</span>
            <span>Zeno</span>
          </div>
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section className="relative w-full min-h-screen flex flex-col">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        
        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen flex-1">
          <div className="mb-auto">
            <div className="text-sm text-white/60 mb-6 font-medium tracking-wide uppercase">// Capabilities</div>
            <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
              Production<br />evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pb-8">
            {/* Card 1 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z"/>
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Natural Context</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Photo Realism</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Infinite Settings</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Eco-Vibe</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">AI Scenery</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">
                  AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z"/>
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Scale Fast</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Visual Consistency</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Time Saver</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Ready to Post</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Batch Production</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">
                  Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z"/>
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Ray Tracing</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Physical Shadows</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Studio Quality</span>
                  <span className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">Sunlight Sync</span>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Smart Lighting</h3>
                <p className="mt-4 text-sm text-white/70 font-light leading-relaxed max-w-[32ch]">
                  Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
