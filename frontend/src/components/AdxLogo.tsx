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
      <rect width="40" height="40" rx="9" fill="#0D1F3C" />
      <polyline points="4,33 15,12 22,21" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22,21 29,8 36,33" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
