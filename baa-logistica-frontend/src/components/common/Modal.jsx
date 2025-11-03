// ============================================
// src/components/common/Modal.jsx
// ============================================
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'modal--sm',
  md: 'modal--md',
  lg: 'modal--lg',
  xl: 'modal--xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const modalClass = ['modal', SIZE_CLASSES[size] || SIZE_CLASSES.md]
    .filter(Boolean)
    .join(' ');

  return (
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
};

export default Modal;
