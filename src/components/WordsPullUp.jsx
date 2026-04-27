import React from 'react';
import { motion, useInView } from 'framer-motion';

export const WordsPullUp = ({ text, className, showAsterisk = false }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const words = text.split(' ');

  return (
    <div ref={ref} className={`flex flex-wrap justify-center overflow-hidden ${className}`}>
      {words.map((word, i) => {
        const isLastWord = i === words.length - 1;
        return (
          <motion.div
            key={i}
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{
              delay: i * 0.08,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block whitespace-nowrap overflow-visible relative mr-[0.25em] last:mr-0"
          >
            {word}
            {isLastWord && showAsterisk && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
