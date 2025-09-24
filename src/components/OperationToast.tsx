'use client';

import { useState, useEffect } from 'react';

interface OperationToastProps {
  message: string;
  type: 'success' | 'error';
  title?: string;
  duration?: number;
  onUndo?: () => void;
  onClose: () => void;
}

export default function OperationToast({
  message,
  type,
  title,
  duration = 5000,
  onUndo,
  onClose
}: OperationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    const countdownTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待动画完成
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    }
    handleClose();
  };

  if (!isVisible) {
    return (
      <div className={`operation-toast ${type} fade-out`}>
        <div className="toast-content">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`operation-toast ${type}`}>
      {/* 图标 */}
      <div className="flex-shrink-0">
        {type === 'success' ? (
          <i className="ri-check-circle-fill text-green-500 text-xl"></i>
        ) : (
          <i className="ri-error-warning-fill text-red-500 text-xl"></i>
        )}
      </div>
      
      {/* 内容 */}
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      
      {/* 操作按钮 */}
      <div className="toast-actions">
        {onUndo && type === 'success' && (
          <button 
            onClick={handleUndo}
            className="toast-button primary"
            title={`撤销 (${Math.ceil(timeLeft)}s)`}
          >
            撤销
          </button>
        )}
        <button 
          onClick={handleClose}
          className="toast-button secondary"
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
}

// Toast管理器组件
interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error';
    title?: string;
    onUndo?: () => void;
  }>;
  onRemoveToast: (id: string) => void;
}

export function ToastManager({ toasts, onRemoveToast }: ToastManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <OperationToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onUndo={toast.onUndo}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}