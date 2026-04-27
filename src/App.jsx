import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import QrCode from './pages/QrCode';
import PingPong from './pages/PingPong';
import Lyrics from './pages/Lyrics';
import IpLocator from './pages/IpLocator';

// Note: Navbar is here to be shared across all pages. 
const Navbar = () => (
  <nav className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex justify-between items-center pointer-events-none font-body">
    <div className="pointer-events-auto w-12 h-12 liquid-glass rounded-full flex items-center justify-center font-heading italic text-3xl text-white">a</div>
    <div className="pointer-events-auto hidden lg:flex liquid-glass rounded-full px-1.5 py-1.5 items-center bg-black/20">
      <Link to="/" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">Home</Link>
      <Link to="/qr-code" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">QR Code</Link>
      <Link to="/ping-pong" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">Ping Pong</Link>
      <Link to="/lyrics" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">Lyrics</Link>
      <Link to="/ip-locator" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors">IP Locator</Link>
      <Link to="/qr-code" className="ml-2 bg-white text-black hover:bg-gray-200 transition-colors px-4 py-2 rounded-full text-sm font-medium flex items-center whitespace-nowrap">
        Claim a Spot
        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
        </svg>
      </Link>
    </div>
    <div className="w-12 h-12 invisible"></div>
  </nav>
);

function App() {
  return (
    <Router>
      <Navbar />
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
