"use client";

import React from 'react';
import Image from 'next/image';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const sizeMap = {
    xs: { imgH: 16, imgW: 26, text: 'text-xs font-black', gap: 'gap-1.5' },
    sm: { imgH: 20, imgW: 32, text: 'text-sm font-black', gap: 'gap-2' },
    md: { imgH: 26, imgW: 42, text: 'text-base sm:text-lg font-black', gap: 'gap-2' },
    lg: { imgH: 34, imgW: 55, text: 'text-xl sm:text-2xl font-black', gap: 'gap-2.5' },
    xl: { imgH: 42, imgW: 68, text: 'text-2xl sm:text-3xl font-black', gap: 'gap-3' },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${current.gap} flex-shrink-0 ${className}`}>
      <Image
        src="/hackpro-icon.png"
        alt="HACKPRO"
        width={current.imgW}
        height={current.imgH}
        className="w-auto object-contain flex-shrink-0"
        style={{ height: `${current.imgH}px` }}
        priority
      />
      {showText && (
        <span className={`tracking-tight uppercase leading-none select-none flex items-center ${current.text} ${textClassName}`}>
          <span className="text-slate-900 dark:text-white">HACK</span>
          <span className="text-[#3760F8] dark:text-[#5F8AFA]">PRO</span>
        </span>
      )}
    </div>
  );
};
