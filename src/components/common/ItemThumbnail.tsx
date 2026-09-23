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
        className={`${sizeClasses} bg-gray-50 dark:bg-[#16181D] border border-gray-200/90 dark:border-[#333842] flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 font-bold select-none shadow-xs ${className}`}
        title={name}
      >
        <Package className={`${iconSizes} opacity-75`} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} overflow-hidden bg-white dark:bg-[#16181D] border border-gray-200/90 dark:border-[#333842] shrink-0 relative select-none shadow-xs p-0.5 flex items-center justify-center ${className}`}
    >
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain rounded-lg transition-transform duration-200 hover:scale-105"
        loading="lazy"
      />
    </div>
  );
};
