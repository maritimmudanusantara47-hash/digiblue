import type { CSSProperties } from 'react';

interface IconProps {
  /** Lineicons name without the "lni-" prefix, e.g. "home-2" */
  name: string;
  /** Font size in px */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const ICON_ALIASES: Record<string, string> = {
  // Navigation & UI
  'apps': 'layout-9',
  'grid': 'layout-9',
  'user-circle': 'user-4',
  'user-1': 'user-4',
  'information': 'info',
  'headphone': 'headphone-1',
  'building-1': 'buildings-1',
  'medal-1': 'trophy-1',
  'alarm-clock': 'alarm-1',
  'timer': 'stopwatch',
  'lock': 'locked-1',
  'bolt': 'bolt-2',
  'shield-check': 'shield-2-check',
  'question-circle': 'question-mark-circle',
  'chat-bubble-dots': 'chat-bubble-2',
  'link': 'link-2-angular-right',
  'link-2': 'link-2-angular-right',
  'book-open': 'book-1',
  'check-circle': 'check-circle-1',
  'credit-card-1': 'credit-card-multiple',
  'trash': 'trash-3',
  'ship-2': 'ship-1',
  'users-social': 'user-multiple-4',
};

/** Thin wrapper around Lineicons 5.0 with built-in aliases and crisp vector SVG fallbacks. */
export default function Icon({ name, size = 16, className = '', style }: IconProps) {
  const resolvedName = ICON_ALIASES[name] || name;

  // Custom high-precision SVG icons for symbols not directly in font
  if (resolvedName === 'scan') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block shrink-0 leading-none align-middle ${className}`}
        style={style}
        aria-hidden="true"
      >
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    );
  }

  if (resolvedName === 'image' || resolvedName === 'photo') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block shrink-0 leading-none align-middle ${className}`}
        style={style}
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    );
  }

  if (resolvedName === 'warning') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block shrink-0 leading-none align-middle ${className}`}
        style={style}
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }

  if (resolvedName === 'whatsapp') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`inline-block shrink-0 leading-none align-middle ${className}`}
        style={style}
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3" />
      </svg>
    );
  }

  return (
    <i
      aria-hidden="true"
      className={`lni lni-${resolvedName} inline-block leading-none align-middle ${className}`}
      style={{ fontSize: size, ...style }}
    />
  );
}
