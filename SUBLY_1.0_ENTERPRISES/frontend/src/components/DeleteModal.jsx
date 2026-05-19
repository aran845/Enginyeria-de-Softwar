export default function DeleteModal({ isOpen, serviceName, onClose, onConfirm }) {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" id="delete-overlay" onClick={handleOverlayClick}>
            <div className="modal modal-sm">
                <div className="modal-header">
                    <h2>¿Eliminar suscripción?</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <p className="delete-message" id="delete-message">
                    ¿Estás seguro de que quieres eliminar "{serviceName}"? Esta acción no se puede deshacer.
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-danger" id="confirm-delete-btn" onClick={onConfirm}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}
