export default function StatsGrid({ monthlyTotal, yearlyTotal, activeCount }) {
    return (
        <div className="stats-grid" id="stats-section">
            <div className="stat-card stat-card-1">
                <div className="stat-icon">💳</div>
                <div className="stat-info">
                    <span className="stat-label">Gasto Mensual</span>
                    <span className="stat-value" id="monthly-total">
                        {monthlyTotal.toFixed(2)}€
                    </span>
                </div>
            </div>
            <div className="stat-card stat-card-2">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                    <span className="stat-label">Gasto Anual</span>
                    <span className="stat-value" id="yearly-total">
                        {yearlyTotal.toFixed(2)}€
                    </span>
                </div>
            </div>
            <div className="stat-card stat-card-3">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                    <span className="stat-label">Suscripciones Activas</span>
                    <span className="stat-value" id="active-count">{activeCount}</span>
                </div>
            </div>
        </div>
    );
}
