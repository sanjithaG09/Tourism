// VeloraLogo.jsx — drop into src/components/VeloraLogo.jsx
// SVG recreation of the Velora compass + location-pin wordmark

export default function VeloraLogo({ size = 32, showText = true, textColor = "#fff", style = {} }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      {/* Compass icon */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer circle */}
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="5" fill="none" />
        {/* Tick marks at N/S/E/W */}
        <line x1="50" y1="8"  x2="50" y2="18" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <line x1="50" y1="82" x2="50" y2="92" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <line x1="8"  y1="50" x2="18" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <line x1="82" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        {/* Compass needle — NE point (dark) */}
        <polygon points="50,18 62,62 50,54" fill="currentColor" />
        {/* SW point (lighter) */}
        <polygon points="50,82 38,38 50,46" fill="currentColor" opacity="0.45" />
        {/* Center dot */}
        <circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="50" r="2.5" fill="currentColor" opacity="0.5" />
      </svg>

      {showText && (
        /* VELORA wordmark — "O" replaced by location pin */
        <svg
          height={size * 0.6}
          viewBox="0 0 190 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* VEL */}
          <text
            x="0" y="32"
            fontFamily="'Sora', 'Arial Black', sans-serif"
            fontWeight="800"
            fontSize="36"
            fill={textColor}
            letterSpacing="-1"
          >VEL</text>

          {/* Location pin as "O" */}
          <g transform="translate(87, 2)">
            {/* pin body */}
            <path
              d="M9 0 C4 0 0 4 0 9 C0 15 9 26 9 26 C9 26 18 15 18 9 C18 4 14 0 9 0Z"
              fill={textColor}
            />
            {/* pin hole */}
            <circle cx="9" cy="9" r="4" fill={textColor === "#fff" ? "#0A0A0A" : "#fff"} />
          </g>

          {/* RA */}
          <text
            x="111" y="32"
            fontFamily="'Sora', 'Arial Black', sans-serif"
            fontWeight="800"
            fontSize="36"
            fill={textColor}
            letterSpacing="-1"
          >RA</text>
        </svg>
      )}
    </span>
  );
}
