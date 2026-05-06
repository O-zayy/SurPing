import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BubbleMenu from './components/BubbleMenu';
import LandingPage from './pages/LandingPage';
import QrCode from './pages/QrCode';
import PingPong from './pages/PingPong';
import Lyrics from './pages/Lyrics';
import IpLocator from './pages/IpLocator';
import appLogo from './assets/Logo.png';

// Menu items for navigation
const menuItems = [
  { label: 'Home', href: '/', rotation: -6, hoverStyles: { bgColor: '#6fff00', textColor: '#010828' } },
  { label: 'QR Code', href: '/qr-code', rotation: 4, hoverStyles: { bgColor: '#eff4ff', textColor: '#010828' } },
  { label: 'Ping Pong', href: '/ping-pong', rotation: -3, hoverStyles: { bgColor: '#ff9f1c', textColor: '#010828' } },
  { label: 'Lyrics', href: '/lyrics', rotation: 5, hoverStyles: { bgColor: '#bde0fe', textColor: '#010828' } },
  { label: 'IP Locator', href: '/ip-locator', rotation: -4, hoverStyles: { bgColor: '#ff4d6d', textColor: '#ffffff' } },
];

// Words that cycle through in the page transition loader
const transitionWords = ['Hello', 'Bonjour', 'Namaste', 'Ciao', 'Hola', 'SurPing'];

// Figures out what final word to show when navigating to each page
function getTargetWord(href) {
  switch (href) {
    case '/': return 'SurPing';
    case '/qr-code': return 'QR Code';
    case '/ping-pong': return 'Ping Pong';
    case '/lyrics': return 'Lyrics';
    case '/ip-locator': return 'IP Locator';
    default: return 'SurPing';
  }
}

function App() {
  const [showLoader, setShowLoader] = useState(false);
  const [targetWord, setTargetWord] = useState('SurPing');
  const [wordIndex, setWordIndex] = useState(transitionWords.length - 1);
  const loaderTimeout = useRef(null);
  const loaderInterval = useRef(null);

  // Set page title on load
  useEffect(() => {
    document.title = 'SurPing';
    return () => {
      if (loaderTimeout.current) clearTimeout(loaderTimeout.current);
      if (loaderInterval.current) clearInterval(loaderInterval.current);
    };
  }, []);

  // Show a quick animated loader when navigating between pages
  function startPageTransition(href = '/') {
    if (loaderTimeout.current) clearTimeout(loaderTimeout.current);
    if (loaderInterval.current) clearInterval(loaderInterval.current);

    setTargetWord(getTargetWord(href));
    setWordIndex(0);
    setShowLoader(true);

    let nextIndex = 0;
    loaderInterval.current = setInterval(() => {
      nextIndex += 1;
      setWordIndex(Math.min(nextIndex, transitionWords.length));
      if (nextIndex >= transitionWords.length) {
        clearInterval(loaderInterval.current);
      }
    }, 160);

    loaderTimeout.current = setTimeout(() => {
      setShowLoader(false);
    }, 1600);

    return 920;
  }

  // Build the word list, replacing the last word with the target page name
  const displayWords = [...transitionWords];
  displayWords[displayWords.length - 1] = targetWord;
  const currentWord = displayWords[Math.min(wordIndex, displayWords.length - 1)];

  return (
    <Router>
      {/* Navigation Menu */}
      <BubbleMenu
        className="mobile-bubble-menu"
        logo={appLogo}
        items={menuItems}
        onLogoClick={() => startPageTransition('/')}
        onNavigateStart={startPageTransition}
      />

      {/* Page Transition Loader */}
      <div className={`site-loader ${showLoader ? 'visible' : ''}`}>
        <div className="site-loader-card">
          <span key={currentWord} className="site-loader-title">{currentWord}</span>
          <span className="site-loader-line" />
        </div>
      </div>

      {/* All Pages */}
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
