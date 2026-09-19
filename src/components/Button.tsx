import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={`btn btn--${variant} btn--${size} ${className ?? ''}`} {...rest} />;
}
