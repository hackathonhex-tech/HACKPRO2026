"use client";
import React, { useRef, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import Image from 'next/image';
import './gallery.css';

const images = [
  { src: '/gallery/13.jpeg', alt: 'Hackathon Event', desc: 'Innovation in action' },
  { src: '/gallery/20250731_161713.jpg', alt: 'Team collaboration', desc: 'Working together' },
  { src: '/gallery/20250731_162953.jpg', alt: 'Project discussion', desc: 'Brainstorming' },
  { src: '/gallery/20250731_171023.jpg', alt: 'Mentoring session', desc: 'Guidance' },
  { src: '/gallery/20250731_171109.jpg', alt: 'Hacking away', desc: 'Deep focus' },
  { src: '/gallery/4.jpeg', alt: 'Event highlights', desc: 'Memorable moments' },
  { src: '/gallery/7.jpeg', alt: 'Presentations', desc: 'Showcasing ideas' },
  { src: '/gallery/wa-7.jpeg', alt: 'Team spirit', desc: 'Building the future' },
  { src: '/gallery/wa-8.jpeg', alt: 'Hackathon vibes', desc: 'Energy and passion' },
  { src: '/gallery/wa-9.jpeg', alt: 'Award ceremony', desc: 'Celebrating success' },
  { src: '/gallery/wa-10.jpeg', alt: 'Closing moments', desc: 'A great journey' },
];

export const GallerySection: React.FC = () => {
  const n = images.length;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const wrapperTop = rect.top;

      if (wrapperTop <= 0) {
        const scrollRange = rect.height - windowHeight;
        const progress = -wrapperTop / scrollRange;

        if (progress >= 0.75) {
          const jumpDistance = 0.5 * scrollRange;
          window.scrollTo({
            top: window.scrollY - jumpDistance,
            behavior: 'auto'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"]
  });

  const kValue = useTransform(scrollYProgress, [0, 1], [-1, 1]);

  return (
    <div className="gal-wrapper" ref={wrapperRef} style={{ '--n': n } as React.CSSProperties}>
      <motion.div className="gal-sticky" style={{ '--k': kValue } as any}>
        <header className="gal-main-header">
          <h2 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 pb-2 drop-shadow-sm uppercase">HACKATHON GALLERY</h2>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl text-center">
            Relive the best moments and innovations from HACKPRO
          </p>
        </header>

        <main className="gal-main">
          <section className="gal-section">
            {images.map((img, i) => (
              <article
                key={i}
                className="gal-article"
                style={{
                  '--i': i,
                } as React.CSSProperties}
              >
                <figure className="gal-figure">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </figure>
              </article>
            ))}
          </section>
        </main>
      </motion.div>
    </div>
  );
}
