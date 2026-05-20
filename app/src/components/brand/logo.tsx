'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'mark' | 'full';
  size?: number;
}

export function Logo({
  variant = 'full',
  size = 32,
  className,
  ...props
}: LogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        className={cn('shrink-0', className)}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <defs>
          <linearGradient id="bg-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#31359C" />
            <stop offset="55%" stopColor="#00A29B" />
            <stop offset="100%" stopColor="#FDCA56" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#bg-mark)" />
        <path
          d="M11 11h10c4.5 0 7 2.2 7 5.5 0 2.4-1.5 4-3.4 4.6 2.3.5 4.1 2.3 4.1 5 0 3.5-2.6 5.9-7.4 5.9H11V11Zm9.6 8c2 0 3.1-.9 3.1-2.4 0-1.5-1.1-2.3-3.1-2.3H15v4.7h5.6Zm.4 8.6c2.2 0 3.4-.9 3.4-2.6 0-1.6-1.2-2.6-3.4-2.6H15v5.2h6Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Logo variant="mark" size={size} />
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="text-foreground">Baldecash</span>
        <span className="text-gradient-brand">.</span>
      </span>
    </span>
  );
}
