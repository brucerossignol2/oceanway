'use client';
import { useRef, useEffect } from 'react';

export default function AnimatedVideoText() {
  const videoRef = useRef(null);

  useEffect(() => {
    // autoplay si autorisé
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="w-full overflow-hidden ">
      <svg viewBox="0 00 800 300" className="w-full w-full h-auto">
        <defs>
          <mask id="text-mask" maskUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="black" />
            {['Réalisez votre rêve', 'en construisant', 'votre financement'].map((line, i) => (
              <text
                key={i}
                x="50%"
                y={`${(i + 2) * 16}%`}
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="48"
                fontWeight="bold"
                fill="white"
                className="font-outfit"
              >
                {line}
              </text>
            ))}
          </mask>
        </defs>

        <foreignObject
          x="0"
          y="0"
          width="100%"
          height="100%"
          mask="url(#text-mask)"
        >
          <video
            ref={videoRef}
            src="https://videos.pexels.com/video-files/3094026/3094026-uhd_2560_1440_30fps.mp4"
            loop
            muted
            playsInline
            className="w-[50rem] h-[20rem] object-fill"
            style={{
              objectPosition: '-30% 70%',
              transform: 'scale(0.6)',
              transformOrigin: 'center',
            }}
          />
        </foreignObject>
      </svg>
    </div>
  );
}
