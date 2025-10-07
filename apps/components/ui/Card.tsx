'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * 卡片容器组件
 * 提供统一的卡片样式和布局
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * 卡片头部组件
 */
export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'p-6 pb-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * 卡片内容组件
 */
export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * 卡片底部组件
 */
export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'p-6 pt-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * 卡片标题组件
 */
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * 卡片描述组件
 */
export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}