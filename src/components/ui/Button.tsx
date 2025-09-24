'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'success';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

/**
 * 通用按钮组件
 * 支持多种样式变体和尺寸
 */
export function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 py-1 text-xs',
    lg: 'h-12 px-6 py-3 text-base'
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}