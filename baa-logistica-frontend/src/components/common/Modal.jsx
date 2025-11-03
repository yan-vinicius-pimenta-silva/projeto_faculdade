// ============================================
// src/components/common/Modal.jsx
// ============================================
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'modal--sm',
  md: 'modal--md',
  lg: 'modal--lg',
  xl: 'modal--xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const previousOverflow = useRef('');

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow.current || '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const modalClass = ['modal', SIZE_CLASSES[size] || SIZE_CLASSES.md]
    .filter(Boolean)
    .join(' ');

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={modalClass}>
          <header className="modal__header">
            <h3 id="modal-title" className="modal__title">{title}</h3>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </header>
          <div className="modal__body">
            {children}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
