import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const TypingMessages = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    const currentMessage = messages[currentMessageIndex];

    if (isDeleting) {
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, 50);
      } else {
        setIsDeleting(false);
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }
    } else {
      if (currentText.length < currentMessage.length) {
        timeout = setTimeout(() => {
          setCurrentText(currentMessage.slice(0, currentText.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentMessageIndex, messages]);

  return (
    <div className="font-nokia text-[#2A3616] text-[10px] sm:text-[12px] leading-tight break-words min-h-[1.5em] flex items-center">
      {currentText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-1.5 h-3 bg-[#2A3616] ml-1 align-middle"
      />
    </div>
  );
};
