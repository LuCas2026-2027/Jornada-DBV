export function BannerIllustration() {
  return (
    <div id="banner-3d-illustration" className="relative w-48 sm:w-64 md:w-80 h-36 sm:h-44 md:h-52 flex items-center justify-center select-none pointer-events-none">
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl overflow-visible"
      >
        <defs>
          <linearGradient id="grad-cap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D3250" />
            <stop offset="100%" stopColor="#1E202B" />
          </linearGradient>
          <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDB813" />
            <stop offset="100%" stopColor="#E08709" />
          </linearGradient>
          <linearGradient id="grad-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBD7B5" />
            <stop offset="100%" stopColor="#E4AC85" />
          </linearGradient>
          <linearGradient id="grad-backpack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#48CAE4" />
            <stop offset="100%" stopColor="#0077B6" />
          </linearGradient>
          <linearGradient id="grad-scroll" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0E8D5" />
          </linearGradient>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.25" floodColor="#1e1040" />
          </filter>
        </defs>

        {/* Floating background decorative spheres */}
        <circle cx="45" cy="40" r="7" fill="#FF5E7E" opacity="0.9" filter="url(#soft-shadow)" />
        <circle cx="150" cy="22" r="5" fill="#48CAE4" opacity="0.9" />
        <circle cx="295" cy="50" r="9" fill="#FDB813" opacity="0.85" filter="url(#soft-shadow)" />
        <circle cx="210" cy="170" r="6" fill="#A78BFA" opacity="0.8" />

        {/* Floating 3D Graduation Cap (Left) */}
        <g transform="translate(15, 30) rotate(-14)" filter="url(#soft-shadow)">
          {/* Cap Base */}
          <path
            d="M 60 70 C 60 85, 100 85, 100 70 L 100 58 C 100 72, 60 72, 60 58 Z"
            fill="#1E202B"
          />
          {/* Cap Diamond Top */}
          <polygon
            points="80,28 135,52 80,75 25,52"
            fill="url(#grad-cap)"
            stroke="#4A4F6B"
            strokeWidth="1.5"
          />
          {/* Cap Button */}
          <ellipse cx="80" cy="52" rx="4.5" ry="3" fill="url(#grad-gold)" />
          {/* Tassel */}
          <path
            d="M 80 52 Q 96 68 108 85"
            stroke="url(#grad-gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="108" cy="86" r="3.5" fill="url(#grad-gold)" />
        </g>

        {/* Floating Diploma Scroll */}
        <g transform="translate(82, 115) rotate(12)" filter="url(#soft-shadow)">
          <rect x="0" y="0" width="60" height="22" rx="4" fill="url(#grad-scroll)" />
          <line x1="4" y1="5" x2="4" y2="17" stroke="#D1C7B7" strokeWidth="1.5" />
          <line x1="56" y1="5" x2="56" y2="17" stroke="#D1C7B7" strokeWidth="1.5" />
          {/* Ribbon */}
          <rect x="25" y="-1" width="10" height="24" rx="2" fill="url(#grad-gold)" />
          <polygon points="30,22 25,32 35,32" fill="#E08709" />
        </g>

        {/* 3D Student Character Avatar (Right) */}
        <g transform="translate(170, 20)">
          {/* Body / Shirt */}
          <path
            d="M 28 135 C 28 100, 92 100, 92 135 Z"
            fill="#3F3D56"
            filter="url(#soft-shadow)"
          />
          {/* Collar / Neck */}
          <rect x="52" y="90" width="16" height="18" rx="4" fill="url(#grad-skin)" />
          {/* Head */}
          <rect x="40" y="38" width="40" height="54" rx="20" fill="url(#grad-skin)" filter="url(#soft-shadow)" />
          {/* Ears */}
          <circle cx="39" cy="65" r="5" fill="#E4AC85" />
          <circle cx="81" cy="65" r="5" fill="#E4AC85" />
          {/* Cap / Hat on Character */}
          <path d="M 38 48 C 38 28, 82 28, 82 48 Z" fill="#2D3250" />
          {/* Cap visor */}
          <path d="M 32 50 Q 60 40 88 50 Q 60 56 32 50 Z" fill="#1E202B" />
          {/* Eyebrows */}
          <path d="M 47 55 Q 52 53 57 56" stroke="#2D3250" strokeWidth="2" strokeLinecap="round" />
          <path d="M 63 56 Q 68 53 73 55" stroke="#2D3250" strokeWidth="2" strokeLinecap="round" />
          {/* Eyes */}
          <ellipse cx="52" cy="63" rx="2.5" ry="3.5" fill="#1E202B" />
          <ellipse cx="68" cy="63" rx="2.5" ry="3.5" fill="#1E202B" />
          <circle cx="53" cy="62" r="0.8" fill="#FFFFFF" />
          <circle cx="69" cy="62" r="0.8" fill="#FFFFFF" />
          {/* Cheerful Smile */}
          <path
            d="M 52 74 Q 60 84 68 74"
            stroke="#2D3250"
            strokeWidth="2"
            strokeLinecap="round"
            fill="#B91C1C"
          />
        </g>

        {/* 3D Backpack beside Student */}
        <g transform="translate(245, 80) rotate(8)" filter="url(#soft-shadow)">
          {/* Bag Body */}
          <rect x="0" y="10" width="42" height="52" rx="12" fill="url(#grad-backpack)" />
          {/* Front Pocket */}
          <rect x="5" y="24" width="32" height="32" rx="8" fill="#0096C7" />
          {/* Pocket Badge */}
          <circle cx="21" cy="40" r="4" fill="#FDB813" />
          {/* Top Handle */}
          <path d="M 12 10 Q 21 0 30 10" stroke="#FDB813" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
