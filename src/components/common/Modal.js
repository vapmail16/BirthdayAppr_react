import React from 'react';
import '../../styles/components/Modal.css';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    {cancelText && (
                        <button className="modal-btn cancel-btn" onClick={onClose}>
                            {cancelText}
                        </button>
                    )}
                    <button className="modal-btn confirm-btn" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal; 