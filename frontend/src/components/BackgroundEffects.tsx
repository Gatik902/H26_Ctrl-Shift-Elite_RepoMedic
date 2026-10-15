import React, { useEffect, useState } from 'react';

export const BackgroundEffects: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const updatePosition = () => {
      // Smooth lerp (linear interpolation) for organic fluid feel
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Floating Organic Liquid Blobs with Keyframe Morphing */}
      {/* Top Left Lavender/Violet Blob */}
      <div 
        className="absolute top-[-8%] left-[-8%] w-[52vw] h-[52vw] max-w-[680px] max-h-[680px] rounded-full blur-[90px] animate-blob-1 opacity-80"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, rgba(192, 132, 252, 0.25) 50%, transparent 70%)'
        }}
      />

      {/* Top Right Sky Cyan / Aquamarine Blob */}
      <div 
        className="absolute top-[5%] right-[-10%] w-[48vw] h-[48vw] max-w-[620px] max-h-[620px] rounded-full blur-[100px] animate-blob-2 opacity-80"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(94, 234, 212, 0.25) 50%, transparent 70%)'
        }}
      />

      {/* Bottom Center Peach / Mint Liquid Blob */}
      <div 
        className="absolute bottom-[-15%] left-[20%] w-[55vw] h-[55vw] max-w-[720px] max-h-[720px] rounded-full blur-[110px] animate-blob-3 opacity-75"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(244, 114, 182, 0.2) 40%, rgba(52, 211, 153, 0.25) 70%, transparent 80%)'
        }}
      />

      {/* 2. Interactive Fluid Mouse Follower Spotlight */}
      <div 
        className={`absolute rounded-full pointer-events-none transition-opacity duration-500 blur-[80px] ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: '540px',
          height: '540px',
          transform: `translate3d(${mousePos.x - 270}px, ${mousePos.y - 270}px, 0)`,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.12) 40%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      {/* 3. Subtle Liquid Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-white/[0.15] backdrop-blur-[1px]" />
    </div>
  );
};
