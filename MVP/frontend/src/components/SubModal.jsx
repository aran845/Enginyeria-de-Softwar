import { useState, useEffect } from 'react';
import { checkBudget } from '../api/api';
import { useSettings } from '../context/SettingsContext';

const QUICK_SERVICES = [
    { name: 'Netflix', icon: '🎬', color: '#e50914', category: 'streaming', price: 12.99 },
    { name: 'Spotify', icon: '🎵', color: '#1db954', category: 'música', price: 9.99 },
    { name: 'Amazon Prime', icon: '📦', color: '#ff9900', category: 'streaming', price: 4.99 },
    { name: 'iCloud', icon: '☁️', color: '#3693f5', category: 'cloud', price: 2.99 },
    { name: 'Disney+', icon: '🏰', color: '#113ccf', category: 'streaming', price: 8.99 },
    { name: 'YouTube Premium', icon: '▶️', color: '#ff0000', category: 'streaming', price: 11.99 },
    { name: 'HBO Max', icon: '🎭', color: '#b535f6', category: 'streaming', price: 9.99 },
    { name: 'Xbox Game Pass', icon: '🎮', color: '#107c10', category: 'gaming', price: 12.99 },
];

export default function SubModal({ isOpen, onClose, onSave, editData, onBudgetWarning }) {
    const { settings, getCurrencySymbol } = useSettings();
    const [form, setForm] = useState({
        service_name: '',
        icon: '📦',
        color: '#6366f1',
        category: 'streaming',
        price: '',
        billing_cycle: 'monthly',
        next_renewal: new Date().toISOString().split('T')[0],
    });

    const isEdit = !!editData;

    useEffect(() => {
        if (editData) {
            setForm({
                service_name: editData.service_name || '',
                icon: editData.icon || '📦',
                color: editData.color || '#6366f1',
                category: editData.category || 'streaming',
                price: editData.price || '',
                billing_cycle: editData.billing_cycle || 'monthly',
                next_renewal: editData.next_renewal || new Date().toISOString().split('T')[0],
            });
        } else {
            setForm({
                service_name: '',
                icon: '📦',
                color: '#6366f1',
                category: 'streaming',
                price: '',
                billing_cycle: 'monthly',
                next_renewal: new Date().toISOString().split('T')[0],
            });
        }
    }, [editData, isOpen]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const selectService = (svc) => {
        setForm({
            ...form,
            service_name: svc.name,
            icon: svc.icon,
            color: svc.color,
            category: svc.category,
            price: svc.price,
            billing_cycle: 'monthly',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Si estamos editando, no validar presupuesto
        if (isEdit) {
            onSave({ ...form, price: parseFloat(form.price) });
            return;
        }

        // Si estamos creando y budget_alert está activado, verificar
        if (!isEdit && settings.budget_alert) {
            try {
                const budgetResult = await checkBudget(parseFloat(form.price), form.billing_cycle);
                if (budgetResult.exceeded) {
                    onBudgetWarning?.(budgetResult, () => {
                        onSave({ ...form, price: parseFloat(form.price) });
                    });
                    return;
                }
            } catch (err) {
                console.error('Error checking budget:', err);
            }
        }

        onSave({ ...form, price: parseFloat(form.price) });
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" id="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" id="subscription-modal">
                <div className="modal-header">
                    <h2 id="modal-title">{isEdit ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
                    <button className="modal-close" onClick={onClose} id="modal-close-btn">×</button>
                </div>

                {!isEdit && (
                    <>
                        <div className="quick-services" id="quick-services">
                            <p className="quick-label">Servicios populares</p>
                            <div className="services-grid">
                                {QUICK_SERVICES.map((svc) => (
                                    <button
                                        key={svc.name}
                                        type="button"
                                        className="service-btn"
                                        onClick={() => selectService(svc)}
                                    >
                                        <span className="service-icon" style={{ background: `${svc.color}20`, color: svc.color }}>
                                            {svc.icon}
                                        </span>
                                        <span>{svc.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-divider"><span>o introduce manualmente</span></div>
                    </>
                )}

                <form id="subscription-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group flex-2">
                            <label htmlFor="service_name">Nombre del servicio</label>
                            <input type="text" id="service_name" name="service_name" placeholder="Ej: Netflix" required value={form.service_name} onChange={handleChange} />
                        </div>
                        <div className="form-group flex-1">
                            <label htmlFor="icon">Icono</label>
                            <input type="text" id="icon" name="icon" placeholder="📦" value={form.icon} onChange={handleChange} maxLength={4} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label htmlFor="price">Precio ({getCurrencySymbol()})</label>
                            <input type="number" id="price" name="price" placeholder="9.99" step="0.01" min="0" required value={form.price} onChange={handleChange} />
                        </div>
                        <div className="form-group flex-1">
                            <label htmlFor="billing_cycle">Ciclo de facturación</label>
                            <select id="billing_cycle" name="billing_cycle" required value={form.billing_cycle} onChange={handleChange}>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label htmlFor="category">Categoría</label>
                            <select id="category" name="category" value={form.category} onChange={handleChange}>
                                <option value="streaming">🎬 Streaming</option>
                                <option value="música">🎵 Música</option>
                                <option value="gaming">🎮 Gaming</option>
                                <option value="cloud">☁️ Cloud</option>
                                <option value="productividad">💼 Productividad</option>
                                <option value="fitness">💪 Fitness</option>
                                <option value="noticias">📰 Noticias</option>
                                <option value="other">📦 Otro</option>
                            </select>
                        </div>
                        <div className="form-group flex-1">
                            <label htmlFor="next_renewal">Próxima renovación</label>
                            <input type="date" id="next_renewal" name="next_renewal" required value={form.next_renewal} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="color">Color del servicio</label>
                        <div className="color-picker">
                            <input type="color" id="color" name="color" value={form.color} onChange={handleChange} />
                            <span className="color-label" id="color-label">{form.color}</span>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" id="save-btn">Guardar Suscripción</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
