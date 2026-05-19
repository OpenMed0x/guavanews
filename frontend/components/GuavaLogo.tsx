export function GuavaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 opacity-95"
    >
      <path
        d="M25 55C25 35 38 18 55 18C75 18 88 35 88 55C88 78 72 88 50 88C32 88 25 75 25 55Z"
        fill="#4ADE80"
        stroke="#16423C"
        strokeWidth="2"
      />
      <ellipse
        cx="45"
        cy="52"
        rx="22"
        ry="28"
        fill="#990000"
        transform="rotate(-15 45 52)"
      />
      <g transform="rotate(-15 45 52)">
        {[40, 45, 52, 59, 66].map((y, i) => (
          <circle
            key={i}
            cx={i % 2 === 0 ? 45 : i === 1 ? 52 : 38}
            cy={y}
            r="1.8"
            fill="white"
            fillOpacity="0.9"
          />
        ))}
      </g>
      <rect x="48" y="5" width="4" height="15" rx="2" fill="#16423C" />
    </svg>
  );
}
