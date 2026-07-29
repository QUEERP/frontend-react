import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const isPointerRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Check if hovering over interactive elements (stable + avoids flicker when target changes)
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const interactive = !!el?.closest(
        'button, a, [role="button"], input, select, textarea, label, summary, [data-cursor="pointer"], .cursor-pointer'
      );

      if (interactive !== isPointerRef.current) {
        isPointerRef.current = interactive;
        setIsPointer(interactive);
      }
    };

    const animateCursor = () => {
      const { x, y } = mousePos.current;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }

      animationFrameRef.current = requestAnimationFrame(animateCursor);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Outer ring cursor */}
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[9999] w-10 h-10 border-2 rounded-full ${
          isPointer ? 'border-accent scale-150' : 'border-accent/40'
        }`}
        style={{
          transition: 'border-color 0.2s ease, transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Inner dot */}
      <div
        ref={dotRef}
        className={`fixed pointer-events-none z-[9999] w-2.5 h-2.5 rounded-full ${
          isPointer ? 'bg-accent scale-125' : 'bg-accent'
        }`}
        style={{
          transition: 'background-color 0.2s ease, transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
        input, textarea {
          cursor: text !important;
        }
      `}</style>
    </>
  );
}
