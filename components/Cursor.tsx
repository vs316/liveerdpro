import React, { memo } from 'react';

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

const Cursor: React.FC<CursorProps> = ({ x, y, color, name }) => {
  return (
    <div 
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-linear"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg className="w-5 h-5 drop-shadow-md" viewBox="0 0 24 24" fill={color} stroke="white" strokeWidth="1.5">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
      <div 
        className="absolute left-4 top-4 px-2 py-1 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};

export default memo(Cursor);