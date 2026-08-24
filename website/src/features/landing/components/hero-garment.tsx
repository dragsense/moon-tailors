/** Decorative jacket + thread — marketing only, no interaction. */
export function HeroGarment() {
  return (
    <svg
      className="hero__garment"
      viewBox="0 0 280 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M140 58c22 0 40 12 48 28l36-18 22 38-42 22v118c0 18-14 32-32 32H108c-18 0-32-14-32-32V128L34 106l22-38 36 18c8-16 26-28 48-28Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M92 128h96M140 58v214"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />
      <path
        d="M108 86c10 14 22 20 32 20s22-6 32-20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="232" cy="72" r="14" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M232 86v28M224 108h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
