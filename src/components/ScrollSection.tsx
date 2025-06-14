import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  threshold?: number;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    } 
  },
};

const ScrollSection: React.FC<ScrollSectionProps> = ({ 
  children, 
  className = "", 
  id,
  threshold = 0.1
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.9, 1],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.1, 0.9, 1],
    [40, 0, 0, -40]
  );

  return (
    <motion.section
      ref={sectionRef}
      className={`relative ${className}`}
      id={id}
      style={{ opacity, y }}
    >
      {children}
    </motion.section>
  );
};

export default ScrollSection; 