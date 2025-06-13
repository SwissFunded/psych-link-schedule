import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'slide' | 'fade' | 'scale' | 'blur' | 'elegant';
}

// Premium easing curves
const easings = {
  smooth: [0.25, 0.1, 0.25, 1.0],
  elegant: [0.19, 1.0, 0.22, 1.0],
  bouncy: [0.68, -0.55, 0.265, 1.55],
  swift: [0.4, 0.0, 0.2, 1.0],
};

// Animation variants for different transition types
const variants = {
  slide: {
    initial: { 
      opacity: 0, 
      x: 60,
      filter: 'blur(4px)',
    },
    animate: { 
      opacity: 1, 
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: easings.elegant,
        staggerChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0, 
      x: -30,
      filter: 'blur(2px)',
      transition: {
        duration: 0.4,
        ease: easings.swift,
      }
    }
  },
  fade: {
    initial: { 
      opacity: 0,
      scale: 0.98,
      filter: 'blur(6px)',
    },
    animate: { 
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: easings.smooth,
        staggerChildren: 0.08,
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.02,
      filter: 'blur(4px)',
      transition: {
        duration: 0.3,
        ease: easings.swift,
      }
    }
  },
  scale: {
    initial: { 
      opacity: 0,
      scale: 0.9,
      y: 20,
      filter: 'blur(8px)',
    },
    animate: { 
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: easings.bouncy,
        staggerChildren: 0.12,
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: -10,
      filter: 'blur(4px)',
      transition: {
        duration: 0.4,
        ease: easings.swift,
      }
    }
  },
  blur: {
    initial: { 
      opacity: 0,
      filter: 'blur(20px) brightness(1.1)',
      scale: 1.05,
    },
    animate: { 
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      scale: 1,
      transition: {
        duration: 0.8,
        ease: easings.elegant,
        staggerChildren: 0.15,
      }
    },
    exit: { 
      opacity: 0,
      filter: 'blur(10px) brightness(0.9)',
      scale: 0.98,
      transition: {
        duration: 0.5,
        ease: easings.swift,
      }
    }
  },
  elegant: {
    initial: { 
      opacity: 0,
      y: 40,
      scale: 0.96,
      filter: 'blur(6px)',
      rotateX: 5,
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: easings.elegant,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      scale: 1.02,
      filter: 'blur(4px)',
      rotateX: -2,
      transition: {
        duration: 0.4,
        ease: easings.swift,
      }
    }
  }
};

// Child animation variants for staggered animations
const childVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    filter: 'blur(4px)',
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: easings.elegant,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    filter: 'blur(2px)',
    transition: {
      duration: 0.3,
      ease: easings.swift,
    }
  }
};

export const PageTransition = ({ 
  children, 
  className = '', 
  variant = 'elegant' 
}: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants[variant]}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${className} will-change-transform`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced component for individual page sections
export const PageSection = ({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      variants={childVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Floating element animation for cards and components
export const FloatingCard = ({ 
  children, 
  className = '',
  index = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  index?: number;
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 60,
        scale: 0.9,
        filter: 'blur(8px)',
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      exit={{ 
        opacity: 0, 
        y: -30,
        scale: 0.95,
        filter: 'blur(4px)',
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: easings.elegant,
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: {
          duration: 0.2,
          ease: easings.swift,
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered list animation
export const StaggeredList = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2,
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredItem = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  return (
    <motion.div
      variants={{
        initial: { 
          opacity: 0, 
          x: -20,
          filter: 'blur(4px)',
        },
        animate: { 
          opacity: 1, 
          x: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.5,
            ease: easings.elegant,
          }
        },
        exit: { 
          opacity: 0, 
          x: 20,
          filter: 'blur(2px)',
          transition: {
            duration: 0.3,
            ease: easings.swift,
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
