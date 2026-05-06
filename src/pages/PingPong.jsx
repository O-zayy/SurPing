import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import './PingPong.css';

// Ping Pong Game Page
// A two-player pong game with keyboard controls (W/S for left, Arrow keys for right)
// and on-screen touch buttons for mobile. First to 5 points wins.
// High scores are saved in localStorage so they persist between sessions.

const DEFAULT_BOUNDS = { width: 600, height: 400 };
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 96;
const PADDLE_OFFSET = 18;
const PADDLE_SPEED = 420;
const BALL_SIZE = 18;
const BALL_START_SPEED_X = 330;
const BALL_START_SPEED_Y_MIN = 180;
const BALL_START_SPEED_Y_MAX = 290;
const BALL_SPEEDUP = 22;
const BALL_MAX_SPEED_X = 560;
const BALL_MAX_SPEED_Y = 460;
const BALL_MIN_SPEED_Y = 115;
const WINNING_SCORE = 5;
const HIGH_SCORE_KEY = 'pingpong_highscores';
const PADDLE_KEYS = new Set(['w', 's', 'arrowup', 'arrowdown']);
const INITIAL_BALL = {
  x: Math.max((DEFAULT_BOUNDS.width - BALL_SIZE) / 2, 0),
  y: Math.max((DEFAULT_BOUNDS.height - BALL_SIZE) / 2, 0),
  speedX: BALL_START_SPEED_X,
  speedY: BALL_START_SPEED_Y_MIN,
};
const INITIAL_PADDLES = {
  left: Math.max((DEFAULT_BOUNDS.height - PADDLE_HEIGHT) / 2, 0),
  right: Math.max((DEFAULT_BOUNDS.height - PADDLE_HEIGHT) / 2, 0),
};
const INITIAL_SCORES = { left: 0, right: 0 };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatSide = (side) => (side === 'left' ? 'Left' : 'Right');

const createPaddles = (bounds) => ({
  left: Math.max((bounds.height - PADDLE_HEIGHT) / 2, 0),
  right: Math.max((bounds.height - PADDLE_HEIGHT) / 2, 0),
});

const createBall = (bounds, direction = Math.random() > 0.5 ? 1 : -1) => {
  const verticalDirection = Math.random() > 0.5 ? 1 : -1;
  const verticalSpeed =
    BALL_START_SPEED_Y_MIN + Math.random() * (BALL_START_SPEED_Y_MAX - BALL_START_SPEED_Y_MIN);

  return {
    x: Math.max((bounds.width - BALL_SIZE) / 2, 0),
    y: Math.max((bounds.height - BALL_SIZE) / 2, 0),
    speedX: direction * BALL_START_SPEED_X,
    speedY: verticalDirection * verticalSpeed,
  };
};

const loadHighScores = () => {
  try {
    const savedScores = window.localStorage.getItem(HIGH_SCORE_KEY);
    return savedScores ? JSON.parse(savedScores) : [];
  } catch {
    return [];
  }
};

const saveHighScores = (scores) => {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  } catch {
    // localStorage can be unavailable in private browsing; the game still works.
  }
};

const PingPong = () => {
  const arenaRef = useRef(null);
  const boundsRef = useRef(DEFAULT_BOUNDS);
  const paddlesRef = useRef(INITIAL_PADDLES);
  const ballStateRef = useRef(INITIAL_BALL);
  const scoresRef = useRef(INITIAL_SCORES);
  const gameRunningRef = useRef(false);
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  const pointTimeoutRef = useRef(null);
  const keyboardControlsRef = useRef(new Set());
  const buttonIntentRef = useRef({ left: 0, right: 0 });
  const paddleIntentRef = useRef({ left: 0, right: 0 });

  const [ball, setBall] = useState(INITIAL_BALL);
  const [paddles, setPaddles] = useState(INITIAL_PADDLES);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [gameOver, setGameOver] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [burning, setBurning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastPointWinner, setLastPointWinner] = useState(null);
  const [highScores, setHighScores] = useState(loadHighScores);

  const syncBall = useCallback((nextBall) => {
    ballStateRef.current = nextBall;
    setBall(nextBall);
  }, []);

  const syncPaddles = useCallback((nextPaddles) => {
    paddlesRef.current = nextPaddles;
    setPaddles(nextPaddles);
  }, []);

  const setRunning = useCallback((running) => {
    gameRunningRef.current = running;
    setGameRunning(running);
  }, []);

  const resetPaddles = useCallback(() => {
    syncPaddles(createPaddles(boundsRef.current));
  }, [syncPaddles]);

  const serveBall = useCallback(
    (direction) => {
      syncBall(createBall(boundsRef.current, direction));
    },
    [syncBall]
  );

  const syncPaddleIntent = useCallback(() => {
    const keys = keyboardControlsRef.current;
    const keyboardIntent = {
      left: (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0),
      right: (keys.has('arrowdown') ? 1 : 0) - (keys.has('arrowup') ? 1 : 0),
    };

    paddleIntentRef.current = {
      left:
        buttonIntentRef.current.left !== 0
          ? buttonIntentRef.current.left
          : clamp(keyboardIntent.left, -1, 1),
      right:
        buttonIntentRef.current.right !== 0
          ? buttonIntentRef.current.right
          : clamp(keyboardIntent.right, -1, 1),
    };
  }, []);

  const clearPaddleIntents = useCallback(() => {
    keyboardControlsRef.current.clear();
    buttonIntentRef.current = { left: 0, right: 0 };
    paddleIntentRef.current = { left: 0, right: 0 };
  }, []);

  const setButtonIntent = useCallback(
    (side, direction) => {
      buttonIntentRef.current = {
        ...buttonIntentRef.current,
        [side]: direction,
      };
      syncPaddleIntent();
    },
    [syncPaddleIntent]
  );

  const releaseButtonIntent = useCallback(
    (side, direction) => {
      if (buttonIntentRef.current[side] !== direction) return;

      buttonIntentRef.current = {
        ...buttonIntentRef.current,
        [side]: 0,
      };
      syncPaddleIntent();
    },
    [syncPaddleIntent]
  );

  const handlePaddleButtonDown = useCallback(
    (event, side, direction) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setButtonIntent(side, direction);
    },
    [setButtonIntent]
  );

  const handlePaddleButtonRelease = useCallback(
    (event, side, direction) => {
      event.preventDefault();

      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      releaseButtonIntent(side, direction);
    },
    [releaseButtonIntent]
  );

  const finishPoint = useCallback(
    (side) => {
      if (gameOverRef.current) return;

      if (pointTimeoutRef.current) {
        window.clearTimeout(pointTimeoutRef.current);
      }

      const otherSide = side === 'left' ? 'right' : 'left';
      const nextScores = {
        ...scoresRef.current,
        [side]: scoresRef.current[side] + 1,
      };

      scoresRef.current = nextScores;
      setScores(nextScores);
      setLastPointWinner(side);
      setRunning(false);

      if (nextScores[side] >= WINNING_SCORE) {
        const record = {
          winner: side,
          winningScore: nextScores[side],
          losingScore: nextScores[otherSide],
          date: new Date().toISOString(),
        };

        gameOverRef.current = true;
        gameStartedRef.current = false;
        setWinner(side);
        setGameOver(true);
        setBurning(true);
        setHighScores((previousScores) => {
          const nextHighScores = [record, ...previousScores].slice(0, 5);
          saveHighScores(nextHighScores);
          return nextHighScores;
        });
        return;
      }

      pointTimeoutRef.current = window.setTimeout(() => {
        setLastPointWinner(null);
        serveBall(side === 'left' ? 1 : -1);
        setRunning(true);
      }, 650);
    },
    [serveBall, setRunning]
  );

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return undefined;

    const measureArena = () => {
      const rect = arena.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const previousBounds = boundsRef.current;
      const nextBounds = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      if (
        Math.abs(previousBounds.width - nextBounds.width) < 1 &&
        Math.abs(previousBounds.height - nextBounds.height) < 1
      ) {
        return;
      }

      const widthRatio = nextBounds.width / previousBounds.width || 1;
      const heightRatio = nextBounds.height / previousBounds.height || 1;
      boundsRef.current = nextBounds;

      syncPaddles({
        left: clamp(
          paddlesRef.current.left * heightRatio,
          0,
          Math.max(nextBounds.height - PADDLE_HEIGHT, 0)
        ),
        right: clamp(
          paddlesRef.current.right * heightRatio,
          0,
          Math.max(nextBounds.height - PADDLE_HEIGHT, 0)
        ),
      });

      syncBall({
        ...ballStateRef.current,
        x: clamp(ballStateRef.current.x * widthRatio, 0, Math.max(nextBounds.width - BALL_SIZE, 0)),
        y: clamp(ballStateRef.current.y * heightRatio, 0, Math.max(nextBounds.height - BALL_SIZE, 0)),
      });
    };

    measureArena();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureArena) : null;

    resizeObserver?.observe(arena);
    window.addEventListener('resize', measureArena);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureArena);
    };
  }, [syncBall, syncPaddles]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (!PADDLE_KEYS.has(key)) return;

      event.preventDefault();
      keyboardControlsRef.current.add(key);
      syncPaddleIntent();
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      if (!PADDLE_KEYS.has(key)) return;

      event.preventDefault();
      keyboardControlsRef.current.delete(key);
      syncPaddleIntent();
    };

    const handleBlur = () => {
      clearPaddleIntents();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [clearPaddleIntents, syncPaddleIntent]);

  useEffect(() => {
    if (!gameRunning) return undefined;

    let animationFrameId;
    let previousFrameTime = performance.now();

    const tick = (frameTime) => {
      if (!gameRunningRef.current) return;

      const delta = Math.min((frameTime - previousFrameTime) / 1000, 0.034);
      previousFrameTime = frameTime;
      const bounds = boundsRef.current;
      const currentBall = ballStateRef.current;
      const currentPaddles = paddlesRef.current;
      const maxPaddleY = Math.max(bounds.height - PADDLE_HEIGHT, 0);
      const paddleIntent = paddleIntentRef.current;
      let activePaddles = currentPaddles;

      if (paddleIntent.left !== 0 || paddleIntent.right !== 0) {
        activePaddles = {
          left: clamp(currentPaddles.left + paddleIntent.left * PADDLE_SPEED * delta, 0, maxPaddleY),
          right: clamp(
            currentPaddles.right + paddleIntent.right * PADDLE_SPEED * delta,
            0,
            maxPaddleY
          ),
        };

        syncPaddles(activePaddles);
      }

      const leftPaddleX = PADDLE_OFFSET;
      const rightPaddleX = Math.max(
        bounds.width - PADDLE_OFFSET - PADDLE_WIDTH,
        leftPaddleX + PADDLE_WIDTH
      );

      let nextBall = {
        x: currentBall.x + currentBall.speedX * delta,
        y: currentBall.y + currentBall.speedY * delta,
        speedX: currentBall.speedX,
        speedY: currentBall.speedY,
      };

      const maxBallY = Math.max(bounds.height - BALL_SIZE, 0);

      if (nextBall.y <= 0) {
        nextBall.y = Math.abs(nextBall.y);
        nextBall.speedY = Math.abs(nextBall.speedY);
      } else if (nextBall.y >= maxBallY) {
        nextBall.y = maxBallY - Math.max(nextBall.y - maxBallY, 0);
        nextBall.speedY = -Math.abs(nextBall.speedY);
      }

      nextBall.y = clamp(nextBall.y, 0, maxBallY);

      const ballBottom = nextBall.y + BALL_SIZE;
      const ballCenter = nextBall.y + BALL_SIZE / 2;
      const leftPaddleBottom = activePaddles.left + PADDLE_HEIGHT;
      const rightPaddleBottom = activePaddles.right + PADDLE_HEIGHT;

      const hitsLeftPaddle =
        nextBall.speedX < 0 &&
        nextBall.x <= leftPaddleX + PADDLE_WIDTH &&
        currentBall.x >= leftPaddleX + PADDLE_WIDTH &&
        ballBottom >= activePaddles.left &&
        nextBall.y <= leftPaddleBottom;

      const hitsRightPaddle =
        nextBall.speedX > 0 &&
        nextBall.x + BALL_SIZE >= rightPaddleX &&
        currentBall.x + BALL_SIZE <= rightPaddleX &&
        ballBottom >= activePaddles.right &&
        nextBall.y <= rightPaddleBottom;

      if (hitsLeftPaddle) {
        const impact = clamp(
          (ballCenter - (activePaddles.left + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2),
          -1,
          1
        );
        const speedX = Math.min(Math.abs(nextBall.speedX) + BALL_SPEEDUP, BALL_MAX_SPEED_X);
        const influencedSpeedY = impact * BALL_MAX_SPEED_Y * 0.82 + paddleIntent.left * 90;
        const speedY = clamp(influencedSpeedY, -BALL_MAX_SPEED_Y, BALL_MAX_SPEED_Y);

        nextBall = {
          ...nextBall,
          x: leftPaddleX + PADDLE_WIDTH,
          speedX,
          speedY:
            Math.abs(speedY) < BALL_MIN_SPEED_Y
              ? Math.sign(nextBall.speedY || 1) * BALL_MIN_SPEED_Y
              : speedY,
        };
      } else if (hitsRightPaddle) {
        const impact = clamp(
          (ballCenter - (activePaddles.right + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2),
          -1,
          1
        );
        const speedX = Math.min(Math.abs(nextBall.speedX) + BALL_SPEEDUP, BALL_MAX_SPEED_X);
        const influencedSpeedY = impact * BALL_MAX_SPEED_Y * 0.82 + paddleIntent.right * 90;
        const speedY = clamp(influencedSpeedY, -BALL_MAX_SPEED_Y, BALL_MAX_SPEED_Y);

        nextBall = {
          ...nextBall,
          x: rightPaddleX - BALL_SIZE,
          speedX: -speedX,
          speedY:
            Math.abs(speedY) < BALL_MIN_SPEED_Y
              ? Math.sign(nextBall.speedY || 1) * BALL_MIN_SPEED_Y
              : speedY,
        };
      }

      if (nextBall.x + BALL_SIZE < 0) {
        finishPoint('right');
        return;
      }

      if (nextBall.x > bounds.width) {
        finishPoint('left');
        return;
      }

      syncBall(nextBall);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [finishPoint, gameRunning, syncBall, syncPaddles]);

  useEffect(
    () => () => {
      if (pointTimeoutRef.current) {
        window.clearTimeout(pointTimeoutRef.current);
      }
    },
    []
  );

  const restartGame = useCallback(() => {
    if (pointTimeoutRef.current) {
      window.clearTimeout(pointTimeoutRef.current);
    }

    clearPaddleIntents();
    const resetScores = { left: 0, right: 0 };
    scoresRef.current = resetScores;
    gameOverRef.current = false;
    gameStartedRef.current = true;
    setScores(resetScores);
    setGameOver(false);
    setBurning(false);
    setWinner(null);
    setLastPointWinner(null);
    resetPaddles();
    serveBall(Math.random() > 0.5 ? 1 : -1);
    setRunning(true);
  }, [clearPaddleIntents, resetPaddles, serveBall, setRunning]);

  const startGame = useCallback(() => {
    if (gameOverRef.current) {
      restartGame();
      return;
    }

    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      setLastPointWinner(null);
      resetPaddles();
      serveBall(Math.random() > 0.5 ? 1 : -1);
    }

    setRunning(true);
  }, [resetPaddles, restartGame, serveBall, setRunning]);

  const pauseGame = useCallback(() => {
    setRunning(false);
  }, [setRunning]);

  const losingSide = winner === 'left' ? 'right' : 'left';
  const winnerScore = winner ? scores[winner] : 0;
  const losingScore = winner ? scores[losingSide] : 0;
  const renderPaddleButton = (side, direction, label, Icon) => (
    <button
      type="button"
      className="paddle-control-button liquid-glass"
      aria-label={`${formatSide(side)} paddle ${label}`}
      onPointerDown={(event) => handlePaddleButtonDown(event, side, direction)}
      onPointerUp={(event) => handlePaddleButtonRelease(event, side, direction)}
      onPointerCancel={(event) => handlePaddleButtonRelease(event, side, direction)}
      onLostPointerCapture={() => releaseButtonIntent(side, direction)}
    >
      <Icon size={24} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#010828] overflow-x-hidden text-cream font-mono">
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 z-0 bg-[#010828]/70 pointer-events-none backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[1831px] px-4 md:px-8 flex flex-col items-center mt-24 pb-12">
        <div className="relative mb-20 flex flex-col items-center">
          <h1 className="font-grotesk text-6xl md:text-8xl lg:text-[100px] uppercase leading-none tracking-wide text-white text-center drop-shadow-2xl">
            PING PONG
          </h1>
          <span className="ping-pong-tagline font-condiment text-neon text-4xl md:text-5xl absolute -bottom-10 -right-8 md:-right-20 -rotate-6 opacity-90 whitespace-nowrap drop-shadow-[0_0_10px_rgba(111,255,0,0.4)]">
            Play Now
          </span>
        </div>

        <div className="ping-pong-panel liquid-glass p-5 md:p-8 rounded-[32px] shadow-2xl backdrop-blur-xl bg-[#010828]/40 border border-white/5">
          <div className="game-shell">
            <div className={`game-over-screen ${gameOver ? 'visible' : ''}`} aria-hidden={!gameOver}>
              <span className="font-grotesk text-5xl md:text-7xl text-neon tracking-wider uppercase drop-shadow-[0_0_15px_rgba(111,255,0,0.6)]">
                GAME OVER
              </span>
              {winner && (
                <p className="game-over-score">
                  {formatSide(winner)} wins {winnerScore} - {losingScore}
                </p>
              )}
              <button className="game-over-button liquid-glass" onClick={restartGame}>
                Play Again
              </button>
            </div>

            <div
              ref={arenaRef}
              className={`ping-pong-container bg-[#010828]/80 rounded-[24px] overflow-hidden relative backdrop-blur-md ${
                gameRunning ? 'is-live' : 'is-paused'
              } ${burning ? 'is-burning' : ''}`}
              tabIndex="0"
              aria-label="Ping Pong arena"
            >
              <div className="arena-scoreboard" aria-live="polite">
                <span className={lastPointWinner === 'left' ? 'point-flash' : ''}>Left {scores.left}</span>
                <span className="score-divider">:</span>
                <span className={lastPointWinner === 'right' ? 'point-flash' : ''}>Right {scores.right}</span>
              </div>
              <div className="center-line" />
              <div
                className={`paddle paddle-left ${gameRunning ? '' : 'paused'}`}
                style={{
                  top: paddles.left,
                  left: PADDLE_OFFSET,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                }}
              />
              <div
                className={`paddle paddle-right ${gameRunning ? '' : 'paused'}`}
                style={{
                  top: paddles.right,
                  right: PADDLE_OFFSET,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                }}
              />
              <div
                className={`ball ${gameRunning ? '' : 'paused'}`}
                style={{
                  top: ball.y,
                  left: ball.x,
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                }}
              />
            </div>
          </div>

          <div className="controls mt-8">
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={startGame}>
              Start
            </button>
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={restartGame}>
              Restart
            </button>
            <button className="liquid-glass bg-black/40 text-cream font-grotesk uppercase px-10 py-4 text-xl hover:text-neon transition-colors hover:bg-black/60 shadow-lg" onClick={pauseGame}>
              Pause
            </button>
          </div>

          <div className="paddle-control-grid" aria-label="Paddle controls">
            <div className="paddle-control-group">
              <span>Left</span>
              <div className="paddle-control-buttons">
                {renderPaddleButton('left', -1, 'up', ChevronUp)}
                {renderPaddleButton('left', 1, 'down', ChevronDown)}
              </div>
            </div>
            <div className="paddle-control-group">
              <span>Right</span>
              <div className="paddle-control-buttons">
                {renderPaddleButton('right', -1, 'up', ChevronUp)}
                {renderPaddleButton('right', 1, 'down', ChevronDown)}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="bg-black/50 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-sm">
              <p className="text-cream/80 text-sm text-center uppercase tracking-widest font-mono m-0">
                Left: W / S &nbsp;&nbsp;|&nbsp;&nbsp; Right: ↑ / ↓
              </p>
            </div>
          </div>

          <div className="high-score-panel">
            <h2>High Scores</h2>
            {highScores.length > 0 ? (
              <ol>
                {highScores.map((entry, index) => (
                  <li key={`${entry.date}-${index}`}>
                    <span>{formatSide(entry.winner)}</span>
                    <strong>
                      {entry.winningScore} - {entry.losingScore}
                    </strong>
                    <time dateTime={entry.date}>
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No games recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PingPong;
