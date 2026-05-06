import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// QR Code Generator Page
// User enters a URL, picks a size, and clicks "Generate" to create a QR code image
// Uses the free qrserver.com API to build the QR image
export default function QrCode() {
  const [temp, setTemp] = useState("");
  const [word, setWord] = useState("");
  const [size, setSize] = useState(400);
  const [qrCode, setQrCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!word) return undefined;

    const startTimer = window.setTimeout(() => {
      setIsGenerating(true);
    }, 0);
    const generateTimer = window.setTimeout(() => {
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(word)}&size=${size}x${size}&bgcolor=ffffff`);
      setIsGenerating(false);
    }, 1500);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(generateTimer);
    };
  }, [word, size]);

  function handleClick() {
    if (temp) {
      setWord(temp);
    }
  }

  // Framer Motion Variants for Staggered Children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#21346e] overflow-x-hidden font-body text-white">
      {/* Background Video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260206_044704_dd33cb15-c23f-4cfc-aa09-a0465d4dcb54.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
      />
      
      <div className="absolute inset-0 bg-black/45 z-0 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-0 pointer-events-none"></div>

      {/* Top-Aligned Layout Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-start px-4 sm:px-6 md:px-12 lg:px-16 pt-28 sm:pt-32 md:pt-48 pb-16 md:pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:items-start gap-12 max-w-[88rem] mx-auto w-full">
          
          {/* Left Column: Typography */}
          <div className="mb-12 md:mb-16 lg:mb-0 drop-shadow-2xl flex flex-col items-start">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-rubik font-bold text-4xl sm:text-6xl md:text-8xl lg:text-[100px] text-white uppercase leading-[0.98] mb-8 md:mb-12"
            >
              NEW ERA<br/>
              OF DESIGN<br/>
              STARTS NOW
            </motion.h1>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative flex items-center justify-center w-[168px] sm:w-[184px] h-[58px] sm:h-[65px] transition-transform duration-300 hover:scale-105 active:scale-95 group"
              onClick={() => document.getElementById('qr-generator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <svg className="absolute inset-0 w-full h-full text-white" viewBox="0 0 184 65" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                {/* A custom path for a unique CTA button shape */}
                <path d="M12 0H172C178.627 0 184 5.37258 184 12V53C184 59.6274 178.627 65 172 65H12C5.37258 65 0 59.6274 0 53V12C0 5.37258 5.37258 0 12 0Z" />
              </svg>
              <span className="relative z-10 font-rubik font-bold uppercase text-[18px] sm:text-[20px] text-[#161a20]">GET STARTED</span>
            </motion.button>
          </div>

          {/* Right Column: QR Generator Glass Card */}
          <div className="flex lg:justify-end" id="qr-generator">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="liquid-glass border border-white/20 p-5 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl backdrop-blur-xl bg-black/50 flex flex-col gap-6"
            >
              
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-widest">Target URL</label>
                <input
                  type="text"
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all font-body font-light"
                  placeholder="https://..."
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-widest">Size (px)</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body font-light focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
                />
              </motion.div>

              {/* Shimmer CTA Button */}
              <motion.div variants={itemVariants}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClick}
                  className="relative overflow-hidden w-full bg-white text-black font-medium text-sm py-3.5 rounded-xl transition-colors hover:bg-gray-200 group"
                >
                  <span className="relative z-10">Generate Code</span>
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0 transform skew-x-12"></div>
                </motion.button>
              </motion.div>

              {/* QR Code Output Container with Scanner Animation */}
              <motion.div variants={itemVariants} className="mt-2 relative flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl p-6 min-h-[220px] overflow-hidden">
                
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="scanner"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    >
                      {/* Laser Line */}
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                      />
                      {/* Laser Gradient Overlay */}
                      <motion.div 
                        animate={{ top: ["-50%", "50%", "-50%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-1/2 bg-gradient-to-b from-transparent to-cyan-400/20"
                      />
                    </motion.div>
                  ) : qrCode ? (
                    <motion.div
                      key="qrcode"
                      initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="relative z-10"
                    >
                      <img 
                        src={qrCode} 
                        alt="Generated QR" 
                        className="rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.1)] mix-blend-screen bg-white p-2 w-full max-w-[260px] sm:max-w-none"
                      />
                    </motion.div>
                  ) : (
                    <motion.span 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-gray-400 text-sm italic font-light z-10 relative"
                    >
                      Code will appear here
                    </motion.span>
                  )}
                </AnimatePresence>

              </motion.div>

            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
