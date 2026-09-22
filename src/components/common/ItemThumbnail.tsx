import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ItemThumbnailProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ItemThumbnail: React.FC<ItemThumbnailProps> = ({
  src,
  name,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-xl',
    xl: 'w-20 h-20 rounded-2xl'
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9'
  }[size];

  if (!src || imgError) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-blue-900/40 via-[#1C2028] to-[#121417] border border-[#333842] flex items-center justify-center text-blue-400 shrink-0 font-bold select-none ${className}`}
        title={name}
      >
        <Package className={`${iconSizes} opacity-80`} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} overflow-hidden bg-[#16181D] border border-[#333842] shrink-0 relative select-none shadow-inner ${className}`}
    >
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </div>
  );
};
