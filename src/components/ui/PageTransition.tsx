
import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.4,
        ease: [0.22, 1.0, 0.36, 1.0], // Custom easing function for more premium feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
