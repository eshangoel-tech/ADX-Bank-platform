export function AnimatedCheckmark({ size = 80 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
        animation: "pulse-glow 1.5s ease-out 0.3s forwards",
        opacity: 0,
      }} />
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="32" fill="rgba(16,185,129,0.08)" />
        <circle cx="40" cy="40" r="32" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
        <circle
          cx="40" cy="40" r="32"
          stroke="var(--success)" strokeWidth="3" strokeLinecap="round" fill="none"
          className="success-circle"
          style={{ strokeDasharray: 201, strokeDashoffset: 201 }}
        />
        <path
          d="M25 41l10 10 20-20"
          stroke="var(--success)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          className="success-check"
          style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
        />
      </svg>
    </div>
  );
}
