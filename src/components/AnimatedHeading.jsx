import React, { useEffect, useState } from 'react';

export const AnimatedHeading = ({ text, className }) => {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const lines = text.split('\n');
  const charDelay = 30;

  return (
    <h1 className={className}>
      {lines.map((line, lineIndex) => {
        const prevChars = lines.slice(0, lineIndex).reduce((acc, l) => acc + l.length, 0);
        return (
          <div key={lineIndex} className="block whitespace-nowrap overflow-visible">
            {line.split('').map((char, charIndex) => {
              const delayMs = (prevChars + charIndex) * charDelay;
              return (
                <span
                  key={charIndex}
                  className="inline-block transition-all duration-500 ease-out"
                  style={{
                    opacity: startAnimation ? 1 : 0,
                    transform: startAnimation ? 'translateX(0)' : 'translateX(-18px)',
                    transitionDelay: `${delayMs}ms`
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
        );
      })}
    </h1>
  );
};
