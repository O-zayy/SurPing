import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import './BubbleMenu.css';

export default function BubbleMenu({
  logo,
  onLogoClick,
  onNavigateStart,
  onMenuClick,
  className,
  style,
  menuAriaLabel = 'Toggle menu',
  useFixedPosition = true,
  items = [],
  animationEase = 'back.out(1.5)',
  animationDuration = 0.5,
  staggerDelay = 0.12,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const overlayRef = useRef(null);
  const bubblesRef = useRef([]);
  const labelRefs = useRef([]);
  const menuTimelineRef = useRef(null);
  const settleTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const containerClassName = [
    'bubble-menu',
    useFixedPosition ? 'fixed' : 'absolute',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const clearSettleTimeout = () => {
    if (settleTimeoutRef.current) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  };

  const handleGlow = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  };

  const handleToggle = () => {
    const nextState = !isMenuOpen;
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    onMenuClick?.(nextState);
  };

  const handleNavigation = (e, href) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    const animationDelay = onNavigateStart?.(href) ?? 300;
    setIsMenuOpen(false);
    onMenuClick?.(false);

    setTimeout(() => {
      navigate(href);
    }, animationDelay);
  };

  const handleLogoClick = (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    const animationDelay = onLogoClick?.() ?? 850;
    setIsMenuOpen(false);
    onMenuClick?.(false);

    window.setTimeout(() => {
      navigate('/');
    }, animationDelay);
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);

    if (!overlay || !bubbles.length) return;

    clearSettleTimeout();
    menuTimelineRef.current?.kill();
    gsap.killTweensOf([...bubbles, ...labels]);

    if (isMenuOpen) {
      gsap.set(overlay, { display: 'flex' });
      gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { y: 24, autoAlpha: 0 });

      menuTimelineRef.current = gsap
        .timeline()
        .to(
          bubbles,
          {
            scale: 1,
            duration: animationDuration,
            ease: animationEase,
            stagger: staggerDelay,
          },
          0
        )
        .to(
          labels,
          {
            y: 0,
            autoAlpha: 1,
            duration: animationDuration * 0.9,
            ease: 'power3.out',
            stagger: staggerDelay,
          },
          0.08
        );

      settleTimeoutRef.current = window.setTimeout(() => {
        gsap.set(bubbles, { scale: 1 });
        gsap.set(labels, { y: 0, autoAlpha: 1 });
      }, (animationDuration + staggerDelay * items.length) * 1000 + 180);
    } else if (showOverlay) {
      gsap.to(labels, {
        y: 24,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power3.in',
        stagger: {
          each: 0.025,
          from: 'end',
        },
      });
      gsap.to(bubbles, {
        scale: 0,
        duration: 0.22,
        ease: 'power3.in',
        stagger: {
          each: 0.025,
          from: 'end',
        },
        onComplete: () => {
          gsap.set(overlay, { display: 'none' });
          setShowOverlay(false);
        },
      });
    }
  }, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay, items.length]);

  useEffect(() => {
    const handleResize = () => {
      if (!isMenuOpen) return;

      const bubbles = bubblesRef.current.filter(Boolean);
      const isDesktop = window.innerWidth >= 900;

      bubbles.forEach((bubble, i) => {
        const item = items[i];
        if (bubble && item) {
          const rotation = isDesktop ? (item.rotation ?? 0) : 0;
          gsap.set(bubble, { rotation });
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, items]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        onMenuClick?.(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen, onMenuClick]);

  useEffect(
    () => () => {
      clearSettleTimeout();
      menuTimelineRef.current?.kill();
    },
    []
  );

  return (
    <>
      <nav
        className={containerClassName}
        style={style}
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="bubble logo-bubble cursor-glow cursor-glow-sm"
          aria-label="Home"
          onMouseMove={handleGlow}
          onClick={handleLogoClick}
        >
          <span className="logo-content">
            {typeof logo === 'string' ? (
              <img src={logo} alt="Logo" className="bubble-logo" />
            ) : (
              logo
            )}
          </span>
        </Link>

        <button
          type="button"
          className={`bubble toggle-bubble menu-btn cursor-glow cursor-glow-sm ${isMenuOpen ? 'open' : ''}`}
          onMouseMove={handleGlow}
          onClick={handleToggle}
          aria-label={menuAriaLabel}
          aria-pressed={isMenuOpen}
        >
          <span className="menu-line" />
          <span className="menu-line short" />
        </button>
      </nav>

      <div
        ref={overlayRef}
        className={`bubble-menu-items cursor-glow cursor-glow-wide ${useFixedPosition ? 'fixed' : 'absolute'} ${className || ''}`}
        aria-hidden={!isMenuOpen}
        onMouseMove={handleGlow}
      >
        <ul className="pill-list relative z-10" role="menu" aria-label="Menu links">
          {items.map((item, idx) => (
            <li key={item.href} role="none" className="pill-col">
              <Link
                role="menuitem"
                to={item.href}
                aria-label={item.ariaLabel || item.label}
                className="pill-link cursor-glow cursor-glow-wide"
                style={{
                  '--item-rot': `${item.rotation ?? 0}deg`,
                  '--hover-bg': item.hoverStyles?.bgColor || '#3b82f6',
                  '--hover-color': item.hoverStyles?.textColor || '#ffffff',
                }}
                onMouseMove={handleGlow}
                ref={(el) => {
                  bubblesRef.current[idx] = el;
                }}
                onClick={(e) => handleNavigation(e, item.href)}
              >
                <span
                  className="pill-label"
                  ref={(el) => {
                    labelRefs.current[idx] = el;
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
