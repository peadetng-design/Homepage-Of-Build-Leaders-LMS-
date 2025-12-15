
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200, className = 'text-white' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={showTooltip} 
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[100] w-max max-w-[200px] px-3 py-2 text-xs font-medium bg-gray-900 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 ${positionClasses[position]} ${className}`}>
          {content}
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 rotate-45 
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
