import React from 'react';

interface EcosystemTreeProps {
  stage: number;
}

export default function EcosystemTree({ stage }: EcosystemTreeProps) {
  // Stages: 0 = Seed, 1 = Sprout, 2 = Sapling, 3 = Young Tree, 4 = Mature, 5 = Bloom
  return (
    <svg viewBox="0 0 200 200" className="tree-canvas-svg">
      <defs>
        <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Ambient Sky Area background */}
      <circle cx="100" cy="100" r="90" fill="url(#skyGrad)" />

      {/* Ground */}
      <path d="M20 170 C 60 160, 140 160, 180 170 L 180 190 L 20 190 Z" fill="#1e293b" />
      <path d="M20 170 C 60 160, 140 160, 180 170" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.6" />

      {/* Stage 0: Seed in Ground */}
      {stage === 0 && (
        <g>
          {/* Glowing spot */}
          <circle cx="100" cy="165" r="8" fill="var(--accent-primary)" opacity="0.4" className="tree-leaf" />
          <ellipse cx="100" cy="166" rx="3" ry="5" fill="#f59e0b" transform="rotate(15 100 166)" />
        </g>
      )}

      {/* Stage 1: Sprout */}
      {stage >= 1 && (
        <g className="tree-branch">
          {/* Stem */}
          <path d="M100 170 Q 98 145, 102 135" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          {/* Sprout Leaves */}
          {stage === 1 && (
            <g>
              <path d="M102 135 C 108 130, 115 132, 118 138 C 112 140, 106 138, 102 135" fill="url(#leafGrad)" className="tree-leaf" />
              <path d="M98 135 C 92 130, 85 132, 82 138 C 88 140, 94 138, 98 135" fill="url(#leafGrad)" className="tree-leaf" />
            </g>
          )}
        </g>
      )}

      {/* Stage 2: Sapling */}
      {stage >= 2 && (
        <g className="tree-branch">
          {/* Extended Trunk */}
          <path d="M100 170 Q 96 130, 104 110" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Small branches */}
          <path d="M100 135 Q 85 125, 80 120" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M101 125 Q 115 118, 122 112" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Leaves */}
          {stage === 2 && (
            <g>
              {/* Branch leaves */}
              <circle cx="80" cy="120" r="8" fill="url(#leafGrad)" className="tree-leaf" />
              <circle cx="122" cy="112" r="8" fill="url(#leafGrad)" className="tree-leaf" />
              <circle cx="104" cy="110" r="10" fill="url(#leafGrad)" className="tree-leaf" />
            </g>
          )}
        </g>
      )}

      {/* Stage 3: Young Tree */}
      {stage >= 3 && (
        <g className="tree-branch">
          {/* Trunk */}
          <path d="M100 170 Q 94 110, 100 80" stroke="url(#trunkGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* Branches */}
          <path d="M97 130 Q 75 110, 70 95" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 115 Q 125 95, 130 85" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 95 Q 85 80, 85 70" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* Foliage spheres */}
          {stage === 3 && (
            <g>
              <circle cx="70" cy="95" r="15" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
              <circle cx="130" cy="85" r="16" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
              <circle cx="85" cy="70" r="14" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
              <circle cx="100" cy="80" r="18" fill="url(#leafGrad)" opacity="0.95" className="tree-leaf" />
            </g>
          )}
        </g>
      )}

      {/* Stage 4: Mature Tree */}
      {stage >= 4 && (
        <g className="tree-branch">
          {/* Thick Trunk */}
          <path d="M100 170 Q 92 100, 100 65" stroke="url(#trunkGrad)" strokeWidth="11" fill="none" strokeLinecap="round" />
          
          {/* Complex Branch System */}
          <path d="M96 125 Q 65 105, 55 90" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M102 110 Q 135 90, 145 75" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M97 90 Q 75 75, 72 55" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M101 80 Q 120 65, 125 50" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          {/* Dense Foliage spheres */}
          {stage === 4 && (
            <g className="tree-leaf">
              <circle cx="55" cy="90" r="22" fill="url(#leafGrad)" opacity="0.9" />
              <circle cx="145" cy="75" r="24" fill="url(#leafGrad)" opacity="0.9" />
              <circle cx="72" cy="55" r="20" fill="url(#leafGrad)" opacity="0.9" />
              <circle cx="125" cy="50" r="18" fill="url(#leafGrad)" opacity="0.9" />
              <circle cx="100" cy="60" r="26" fill="url(#leafGrad)" opacity="0.95" />
            </g>
          )}
        </g>
      )}

      {/* Stage 5: Blooming Ecosystem */}
      {stage === 5 && (
        <g>
          {/* Base Mature Tree Foliage */}
          <g className="tree-leaf">
            <circle cx="55" cy="90" r="23" fill="url(#leafGrad)" opacity="0.85" />
            <circle cx="145" cy="75" r="25" fill="url(#leafGrad)" opacity="0.85" />
            <circle cx="72" cy="55" r="21" fill="url(#leafGrad)" opacity="0.85" />
            <circle cx="125" cy="50" r="19" fill="url(#leafGrad)" opacity="0.85" />
            <circle cx="100" cy="60" r="28" fill="url(#leafGrad)" opacity="0.9" />
          </g>

          {/* Red Blooming Flowers */}
          <g className="tree-leaf">
            <circle cx="65" cy="85" r="4" fill="url(#flowerGrad)" />
            <circle cx="135" cy="70" r="5" fill="url(#flowerGrad)" />
            <circle cx="100" cy="50" r="4.5" fill="url(#flowerGrad)" />
            <circle cx="80" cy="55" r="4" fill="url(#flowerGrad)" />
            <circle cx="120" cy="55" r="5" fill="url(#flowerGrad)" />
            <circle cx="148" cy="82" r="4" fill="url(#flowerGrad)" />
          </g>

          {/* Butterflies & Clouds */}
          <g opacity="0.8" className="tree-leaf">
            {/* Cloud Left */}
            <path d="M15 45 a 6 6 0 0 1 12 0 a 8 8 0 0 1 14 2 a 6 6 0 0 1 -2 11 L 13 58 A 6 6 0 0 1 15 45 Z" fill="white" opacity="0.25" />
            {/* Cloud Right */}
            <path d="M155 35 a 5 5 0 0 1 10 0 a 7 7 0 0 1 12 2 a 5 5 0 0 1 -2 9 L 153 46 A 5 5 0 0 1 155 35 Z" fill="white" opacity="0.2" />

            {/* Butterflies */}
            <path d="M45 80 L 48 83 L 45 86 Z M48 83 L 51 80 L 51 86 Z" fill="#f59e0b" />
            <path d="M160 100 L 163 103 L 160 106 Z M163 103 L 166 100 L 166 106 Z" fill="var(--accent-primary)" />
          </g>
        </g>
      )}
    </svg>
  );
}
