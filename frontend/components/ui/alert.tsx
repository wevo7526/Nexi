import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function Alert({ children, className = '', variant = 'default' }: AlertProps) {
  const variants = {
    default: 'bg-background text-foreground',
    destructive: 'bg-destructive/15 text-destructive border-destructive/50'
  };

  return (
    <div
      className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
} 