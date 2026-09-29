import { CSSProperties } from 'react';

const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#34d399', '#a78bfa', '#fb923c'];

// Pieces are spread with fixed math instead of Math.random so re-renders don't reshuffle them.
export function Confetti({ pieces = 40 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: pieces }, (_, index) => (
        <span
          key={index}
          style={
            {
              left: `${(index * 37) % 100}%`,
              background: COLORS[index % COLORS.length],
              animationDelay: `${(index % 10) * 0.07}s`,
              animationDuration: `${2 + (index % 5) * 0.35}s`,
              '--confetti-drift': `${((index * 53) % 80) - 40}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
