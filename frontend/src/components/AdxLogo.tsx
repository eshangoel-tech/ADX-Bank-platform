interface AdxLogoProps {
  size?: number;
}

export function AdxLogo({ size = 40 }: AdxLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ADX Bank"
    >
      {/* Navy background */}
      <rect width="40" height="40" rx="9" fill="#0D1F3C" />

      {/* Gold left diagonal of A */}
      <path d="M9 32 L20 10" stroke="#D4AF37" strokeWidth="4.2" strokeLinecap="round" />
      {/* White right diagonal of A */}
      <path d="M20 10 L31 32" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
      {/* White crossbar */}
      <line x1="14" y1="24" x2="26" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Gold X accent — bottom right */}
      <line x1="29" y1="26" x2="34" y2="32" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="26" x2="29" y2="32" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
