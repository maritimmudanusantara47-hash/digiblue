import React from 'react';

export interface LineIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export function LineIcon({ name, className = '', size, style, ...props }: LineIconProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    ...(size ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
  };

  return (
    <i
      className={`lni lni-${name} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export default LineIcon;
