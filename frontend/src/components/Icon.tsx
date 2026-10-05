import type { CSSProperties } from 'react';

interface IconProps {
  /** Lineicons name without the "lni-" prefix, e.g. "home-2" */
  name: string;
  /** Font size in px */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Thin wrapper around the Lineicons icon font (loaded via CDN in the root layout). */
export default function Icon({ name, size = 16, className = '', style }: IconProps) {
  return (
    <i
      aria-hidden="true"
      className={`lni lni-${name} inline-block leading-none align-middle ${className}`}
      style={{ fontSize: size, ...style }}
    />
  );
}
