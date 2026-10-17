import type { SVGProps } from "react";

/**
 * Official Saudi Riyal symbol (رمز الريال السعودي).
 *
 * Geometry is the Saudi Central Bank (SAMA) master vector, embedded verbatim and
 * placed with a single affine transform so the shape stays exactly as published.
 * At this size the glyph's stems measure 2 units inside the 24px box, which is
 * Lucide's default stroke weight — so it sits next to Lucide icons without
 * looking heavier or smaller.
 */

const SAMA_VIEWBOX = { width: 1124.14, height: 1256.39 };
const SAMA_SCALE = 19 / SAMA_VIEWBOX.height;
const OFFSET_X = (24 - SAMA_VIEWBOX.width * SAMA_SCALE) / 2;
const OFFSET_Y = (24 - SAMA_VIEWBOX.height * SAMA_SCALE) / 2;

export type SaudiRiyalProps = SVGProps<SVGSVGElement> & { size?: number | string };

export function SaudiRiyal({ size = 24, ...props }: SaudiRiyalProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke="none"
      focusable="false"
      {...props}
    >
      <g
        transform={`translate(${OFFSET_X.toFixed(4)} ${OFFSET_Y.toFixed(4)}) scale(${SAMA_SCALE.toFixed(7)})`}
      >
        <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
        <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
      </g>
    </svg>
  );
}

export default SaudiRiyal;
