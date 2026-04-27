import React, { useState, useEffect, useRef } from 'react';
import './PingPong.css';

const PingPong = () => {
  const initialBallState = { x: 300, y: 200, speedX: 5, speedY: 5 };
  const initialPaddleState = { left: 150, right: 150 };
  const [ball, setBall] = useState(initialBallState);
  const [paddles, setPaddles] = useState(initialPaddleState);
  const [gameOver, setGameOver] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const ballRef = useRef(null);

  useEffect(() => {
    if (gameRunning) {
      const handleKeyPress = (e) => {
        switch (e.key) {
          case 'ArrowUp':
            setPaddles((prev) => ({ ...prev, right: Math.max(prev.right - 20, 0) }));
            break;
          case 'ArrowDown':
            setPaddles((prev) => ({ ...prev, right: Math.min(prev.right + 20, 300) }));
            break;
          case 'w':
            setPaddles((prev) => ({ ...prev, left: Math.max(prev.left - 20, 0) }));
            break;
          case 's':
          case 'd':
            setPaddles((prev) => ({ ...prev, left: Math.min(prev.left + 20, 300) }));
            break;
          default:
            break;
        }
      };

      const updateGame = () => {
        setBall((prevBall) => {
          let newX = prevBall.x + prevBall.speedX;
          let newY = prevBall.y + prevBall.speedY;
          let newSpeedX = prevBall.speedX;
          let newSpeedY = prevBall.speedY;

          if (newY <= 0 || newY >= 380) {
            newSpeedY = -newSpeedY;
          }

          if (newX <= 20 && newY + 20 >= paddles.left && newY <= paddles.left + 100) {
            newSpeedX = Math.abs(newSpeedX);
          }
          
          if (newX >= 560 && newY + 20 >= paddles.right && newY <= paddles.right + 100) {
            newSpeedX = -Math.abs(newSpeedX);
          }

          if (newX < 0 || newX > 600) {
            setGameOver(true);
            setGameRunning(false);
          }

          return { x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
        });
      };
      const intervalId = setInterval(updateGame, 50);

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [gameRunning, paddles]);

  const startGame = () => {
    setGameRunning(true);
  };

  const restartGame = () => {
    setBall(initialBallState);
    setPaddles(initialPaddleState);
    setGameOver(false);
  };

  const pauseGame = () => {
    setGameRunning(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#010828] overflow-hidden text-cream font-mono">
      {/* Background Video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Dark Overlay for better contrast */}
      <div className="absolute inset-0 z-0 bg-[#010828]/70 pointer-events-none backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-[1831px] px-4 md:px-8 flex flex-col items-center mt-24 pb-12">
        
        {/* Header Section */}
        <div className="relative mb-20 flex flex-col items-center">
          <h1 className="font-grotesk text-6xl md:text-8xl lg:text-[100px] uppercase leading-none tracking-wide text-white text-center drop-shadow-2xl">
            PING PONG
          </h1>
          <span className="font-condiment text-neon text-4xl md:text-5xl absolute -bottom-10 -right-8 md:-right-20 -rotate-6 opacity-90 whitespace-nowrap drop-shadow-[0_0_10px_rgba(111,255,0,0.4)]">
            Play Now
          </span>
        </div>

        {/* Game Container */}
        <div className="liquid-glass p-6 md:p-8 rounded-[32px] shadow-2xl backdrop-blur-xl bg-[#010828]/40 border border-white/5">
          <div className="ping-pong-container bg-[#010828]/80 rounded-[24px] overflow-hidden relative backdrop-blur-md" tabIndex="0">
            <div
              className={`paddle paddle-left ${gameRunning ? '' : 'paused'}`}
              id="paddle-left"
              style={{ top: `${paddles.left}px` }}
            />
            <div
              className={`paddle paddle-right ${gameRunning ? '' : 'paused'}`}
              id="paddle-right"
              style={{ top: `${paddles.right}px`, left: '580px' }}
            />
            <div
              className={`ball ${gameRunning ? '' : 'paused'}`}
              ref={ballRef}
              style={{ top: `${ball.y}px`, left: `${ball.x}px` }}
            />
            {gameOver && (
              <div className="game-over liquid-glass rounded-[24px] z-20 flex flex-col items-center justify-center bg-black/80">
                <span className="font-grotesk text-6xl md:text-7xl text-neon tracking-wider uppercase drop-shadow-[0_0_15px_rgba(111,255,0,0.6)]">GAME OVER</span>
                <button className="mt-8 liquid-glass bg-white/10 text-cream font-grotesk uppercase px-8 py-4 text-xl hover:text-neon transition-colors hover:bg-white/20" onClick={restartGame}>Play Again</button>
              </div>
            )}
          </div>
          
          <div className="controls mt-8">
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={startGame}>Start</button>
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={restartGame}>Restart</button>
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={pauseGame}>Pause</button>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="bg-black/50 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-sm">
              <p className="text-cream/80 text-sm text-center uppercase tracking-widest font-mono m-0">
                Left: W / S &nbsp;&nbsp;|&nbsp;&nbsp; Right: ↑ / ↓
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PingPong;
