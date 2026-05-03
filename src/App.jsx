import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import BubbleMenu from './components/BubbleMenu';
import LandingPage from './pages/LandingPage';
import QrCode from './pages/QrCode';
import PingPong from './pages/PingPong';
import Lyrics from './pages/Lyrics';
import IpLocator from './pages/IpLocator';
import appLogo from './assets/Logo.png';

const menuItems = [
  {
    label: 'Home',
    href: '/',
    rotation: -6,
    hoverStyles: { bgColor: '#6fff00', textColor: '#010828' },
  },
  {
    label: 'QR Code',
    href: '/qr-code',
    rotation: 4,
    hoverStyles: { bgColor: '#eff4ff', textColor: '#010828' },
  },
  {
    label: 'Ping Pong',
    href: '/ping-pong',
    rotation: -3,
    hoverStyles: { bgColor: '#ff9f1c', textColor: '#010828' },
  },
  {
    label: 'Lyrics',
    href: '/lyrics',
    rotation: 5,
    hoverStyles: { bgColor: '#bde0fe', textColor: '#010828' },
  },
  {
    label: 'IP Locator',
    href: '/ip-locator',
    rotation: -4,
    hoverStyles: { bgColor: '#ff4d6d', textColor: '#ffffff' },
  },
];

const transitionWords = ['Hello', 'Bonjour', 'Namaste', 'Ciao', 'Hola', 'SurPing'];

const handleGlow = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
};

function DesktopNavbar({ logo, items, onNavigateStart }) {
  const navigate = useNavigate();

  const handleNavigation = (e, href) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    const animationDelay = onNavigateStart?.(href) ?? 900;

    window.setTimeout(() => {
      navigate(href);
    }, animationDelay);
  };

  return null;
}

const getTargetWord = (href) => {
  switch (href) {
    case '/': return 'SurPing';
    case '/qr-code': return 'QR Code';
    case '/ping-pong': return 'Ping Pong';
    case '/lyrics': return 'Lyrics';
    case '/ip-locator': return 'IP Locator';
    default: return 'SurPing';
  }
};

function App() {
  const [showSiteLoader, setShowSiteLoader] = useState(false);
  const [targetLoaderWord, setTargetLoaderWord] = useState('SurPing');
  const [loaderWordIndex, setLoaderWordIndex] = useState(transitionWords.length - 1);
  const loaderTimeoutRef = useRef(null);
  const loaderIntervalRef = useRef(null);

  useEffect(() => {
    document.title = 'SurPing';

    return () => {
      if (loaderTimeoutRef.current) {
        window.clearTimeout(loaderTimeoutRef.current);
      }
      if (loaderIntervalRef.current) {
        window.clearInterval(loaderIntervalRef.current);
      }
    };
  }, []);

  const startPageTransition = (href = '/') => {
    if (loaderTimeoutRef.current) {
      window.clearTimeout(loaderTimeoutRef.current);
    }
    if (loaderIntervalRef.current) {
      window.clearInterval(loaderIntervalRef.current);
    }

    setTargetLoaderWord(getTargetWord(href));
    setLoaderWordIndex(0);
    setShowSiteLoader(true);

    let nextIndex = 0;
    loaderIntervalRef.current = window.setInterval(() => {
      nextIndex += 1;
      setLoaderWordIndex(Math.min(nextIndex, transitionWords.length));

      if (nextIndex >= transitionWords.length && loaderIntervalRef.current) {
        window.clearInterval(loaderIntervalRef.current);
        loaderIntervalRef.current = null;
      }
    }, 160); // Slowed down from 135

    loaderTimeoutRef.current = window.setTimeout(() => {
      setShowSiteLoader(false);
    }, 1600); // Increased from 1280 to show QR Code / SurPing for longer

    return 920;
  };

  const currentWords = [...transitionWords];
  currentWords[currentWords.length - 1] = targetLoaderWord;

  return (
    <Router>
      <DesktopNavbar logo={appLogo} items={menuItems} onNavigateStart={startPageTransition} />
      <BubbleMenu
        className="mobile-bubble-menu"
        logo={appLogo}
        items={menuItems}
        onLogoClick={() => startPageTransition('/')}
        onNavigateStart={startPageTransition}
      />
      <div className={`site-loader ${showSiteLoader ? 'visible' : ''}`} aria-hidden={!showSiteLoader}>
        <div className="site-loader-card">
          <span key={currentWords[Math.min(loaderWordIndex, currentWords.length - 1)]} className="site-loader-title">
            {currentWords[Math.min(loaderWordIndex, currentWords.length - 1)]}
          </span>
          <span className="site-loader-line" />
        </div>
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/qr-code" element={<QrCode />} />
        <Route path="/ping-pong" element={<PingPong />} />
        <Route path="/lyrics" element={<Lyrics />} />
        <Route path="/ip-locator" element={<IpLocator />} />
      </Routes>
    </Router>
  );
}

export default App;
