'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function SplitPane({
  left,
  right,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  orientation = 'horizontal',
  className = '',
}: SplitPaneProps) {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const percentage = orientation === 'horizontal'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;

      setSize(Math.max(minSize, Math.min(maxSize, percentage)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, orientation, minSize, maxSize]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} h-full w-full ${className}`}
    >
      <div style={{ [isHorizontal ? 'width' : 'height']: `${size}%` }} className="overflow-auto">
        {left}
      </div>

      <div
        onMouseDown={() => setIsDragging(true)}
        className={`
          ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
          bg-border hover:bg-primary transition-colors
          ${isDragging ? 'bg-primary' : ''}
        `}
      />

      <div className="flex-1 overflow-auto">
        {right}
      </div>
    </div>
  );
}
