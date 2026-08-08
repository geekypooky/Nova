import React from 'react';

export default function LineArtBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft gradient orb in the background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#9ABF17] opacity-10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#84BF93] opacity-10 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Abstract Line Art SVG (Birds & Flowers motif inspired curves) */}
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        stroke="#84BF93"
        strokeWidth="0.5"
        opacity="0.4"
      >
        <path className="animate-[dash_20s_linear_infinite]"
          d="M -10,50 C 20,20 40,80 110,40"
          strokeDasharray="200" strokeDashoffset="200"
        />
        <path className="animate-[dash_25s_linear_infinite]"
          d="M -10,70 C 30,100 50,10 110,60"
          strokeDasharray="200" strokeDashoffset="200"
        />
        <path className="animate-[dash_30s_linear_infinite]"
          d="M -10,30 C 40,70 60,-10 110,80"
          strokeDasharray="200" strokeDashoffset="200"
        />
        {/* Abstract floral curve */}
        <path className="animate-[dash_22s_linear_infinite]"
          d="M 20,110 C 10,70 80,40 50,-10"
          strokeDasharray="200" strokeDashoffset="200"
        />
        {/* Abstract bird curve */}
        <path className="animate-[dash_18s_linear_infinite]"
          d="M 80,110 C 90,60 10,60 30,-10"
          strokeDasharray="200" strokeDashoffset="200"
        />
      </svg>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
