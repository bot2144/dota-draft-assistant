import type { PropsWithChildren, ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Panel({ title, action, className, glow, children }: PropsWithChildren<PanelProps>) {
  return (
    <section className={`panel ${glow ? 'panel--glow' : ''} ${className ?? ''}`}>
      {(title || action) && (
        <header className="panel__header">
          {title && <h2 className="panel__title">{title}</h2>}
          {action}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}
