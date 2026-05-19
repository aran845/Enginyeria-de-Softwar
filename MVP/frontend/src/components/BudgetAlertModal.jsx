import { useSettings } from '../context/SettingsContext';

export default function BudgetAlertModal({ isOpen, budgetData, onConfirm, onCancel }) {
    const { settings, getCurrencySymbol } = useSettings();

    if (!isOpen || !budgetData) return null;

    const { current, new_total, budget_limit, difference } = budgetData;
    const symbol = getCurrencySymbol();

    return (
        <div className="modal-overlay active" id="budget-alert-overlay" onClick={onCancel}>
            <div className="modal modal-warning" id="budget-alert-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="budget-alert-title">⚠️ Alerta de Presupuesto</h2>
                    <button className="modal-close" onClick={onCancel}>×</button>
                </div>

                <div className="budget-alert-content" id="budget-alert-content">
                    <p className="alert-text">
                        Esta nueva suscripción superará tu presupuesto mensual.
                    </p>

                    <div className="budget-comparison">
                        <div className="budget-item">
                            <span className="label">Gasto Actual:</span>
                            <span className="value">{symbol}{current.toFixed(2)}</span>
                        </div>
                        <div className="budget-item">
                            <span className="label">Presupuesto Límite:</span>
                            <span className="value">{symbol}{budget_limit.toFixed(2)}</span>
                        </div>
                        <div className="budget-divider">+</div>
                        <div className="budget-item total">
                            <span className="label">Total después de agregar:</span>
                            <span className="value exceed">{symbol}{new_total.toFixed(2)}</span>
                        </div>
                        <div className="budget-excess">
                            <span className="label">Exceso:</span>
                            <span className="value exceed">{symbol}{difference.toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="warning-message" id="warning-msg">
                        ¿Deseas continuar de todas formas? Esto superará tu presupuesto mensual en {symbol}{difference.toFixed(2)}.
                    </p>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm} id="budget-confirm-btn">
                        ✓ Continuar de todas formas
                    </button>
                </div>
            </div>
        </div>
    );
}
