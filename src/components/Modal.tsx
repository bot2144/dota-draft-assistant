import type { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './Modal.css';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ title, onClose, wide, children }: PropsWithChildren<ModalProps>) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label={t('common.close') ?? 'Close'}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
