export default function SubCard({ sub, onEdit, onDelete }) {
    // Calcular días hasta renovación
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(sub.next_renewal + 'T00:00:00');
    const diffTime = renewal - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determinar urgencia
    const isUrgent = daysLeft <= 1;
    const isWarning = daysLeft > 1 && daysLeft <= 7;

    // Texto de renovación
    let renewalText;
    if (daysLeft < 0) {
        renewalText = 'Vencida';
    } else if (daysLeft === 0) {
        renewalText = '¡Hoy!';
    } else if (daysLeft === 1) {
        renewalText = '¡Mañana!';
    } else {
        renewalText = `En ${daysLeft} días`;
    }

    return (
        <div
            className={`sub-card ${!sub.is_active ? 'sub-inactive' : ''} ${isUrgent ? 'sub-urgent' : ''} ${isWarning ? 'sub-renewal' : ''}`}
            data-id={sub.id}
        >
            <div className="sub-card-header" style={{ borderColor: sub.color }}>
                <div
                    className="sub-icon"
                    style={{ background: `${sub.color}20`, color: sub.color }}
                >
                    {sub.icon}
                </div>
                <div className="sub-actions">
                    <button
                        className="sub-action-btn"
                        onClick={() => onEdit(sub.id)}
                        title="Editar"
                        id={`edit-btn-${sub.id}`}
                    >
                        ✏️
                    </button>
                    <button
                        className="sub-action-btn sub-action-delete"
                        onClick={() => onDelete(sub.id, sub.service_name)}
                        title="Eliminar"
                        id={`delete-btn-${sub.id}`}
                    >
                        🗑️
                    </button>
                </div>
            </div>
            <h3 className="sub-name">{sub.service_name}</h3>
            <span className="sub-category">{sub.category}</span>
            <div className="sub-price-row">
                <span className="sub-price">{sub.price.toFixed(2)}€</span>
                <span className="sub-cycle">
                    / {sub.billing_cycle === 'monthly' ? 'mes' : 'año'}
                </span>
            </div>
            <div className="sub-footer">
                <span className="sub-renewal-label">Próxima renovación</span>
                <span className={`sub-renewal-date ${isUrgent ? 'renewal-urgent' : ''} ${isWarning ? 'renewal-warning' : ''}`}>
                    {renewalText}
                </span>
            </div>
        </div>
    );
}
