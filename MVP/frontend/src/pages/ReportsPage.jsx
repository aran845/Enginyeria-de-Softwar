import { useState, useEffect } from 'react';
import { getDashboard } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Sidebar from '../components/Sidebar';

export default function ReportsPage() {
    const { user } = useAuth();
    const { getCurrencySymbol } = useSettings();
    const symbol = getCurrencySymbol();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getDashboard();
                setData(result);
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="app-container">
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando reportes...</p>
                </main>
            </div>
        );
    }

    const subs = data?.subscriptions || [];

    // Análisis por categoría
    const categoryBreakdown = subs.reduce((acc, sub) => {
        if (!acc[sub.category]) {
            acc[sub.category] = { total: 0, count: 0 };
        }
        acc[sub.category].total += sub.price;
        acc[sub.category].count += 1;
        return acc;
    }, {});

    // Top 5 subscripciones más caras
    const topExpensive = [...subs].sort((a, b) => b.price - a.price).slice(0, 5);

    // Subscripciones activas vs inactivas
    const activeCount = subs.filter(s => s.is_active).length;
    const inactiveCount = subs.length - activeCount;

    // Próximas renovaciones
    const upcoming = subs.filter(s => s.is_active)
        .sort((a, b) => new Date(a.next_renewal) - new Date(b.next_renewal))
        .slice(0, 5);

    return (
        <div className="app-container">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <Sidebar />

            <main className="main-content">
                {/* Header */}
                <div className="content-header">
                    <h1 className="greeting">📊 Reportes y Análisis</h1>
                    <p className="greeting-sub">Visualiza tus patrones de gasto</p>
                </div>

                {/* Summary Cards */}
                <div className="reports-summary" id="reports-summary">
                    <div className="summary-card">
                        <div className="summary-label">Gasto Mensual</div>
                        <div className="summary-value">{symbol}{data?.monthly_total?.toFixed(2) || '0.00'}</div>
                        <div className="summary-detail">{subs.length} suscripciones</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Gasto Anual</div>
                        <div className="summary-value">{symbol}{data?.yearly_total?.toFixed(2) || '0.00'}</div>
                        <div className="summary-detail">Proyectado</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Activas</div>
                        <div className="summary-value">{activeCount}</div>
                        <div className="summary-detail">{inactiveCount} inactivas</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Promedio</div>
                        <div className="summary-value">{symbol}{(data?.monthly_total / subs.length || 0).toFixed(2)}</div>
                        <div className="summary-detail">Por suscripción</div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="reports-grid" id="reports-grid">
                    {/* Category Breakdown */}
                    <section className="report-section" id="category-report">
                        <h2>💰 Gasto por Categoría</h2>
                        <div className="category-breakdown">
                            {Object.entries(categoryBreakdown)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([category, data]) => {
                                    const percentage = (data.total / (data?.monthly_total || 1)) * 100;
                                    return (
                                        <div key={category} className="category-item">
                                            <div className="category-header">
                                                <span className="category-name">{category}</span>
                                                <span className="category-count">({data.count})</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${Math.min(percentage, 100)}%`,
                                                        background: `linear-gradient(90deg, #6366f1, #8b5cf6)`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="category-amount">{symbol}{data.total.toFixed(2)}</div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>

                    {/* Top Expensive */}
                    <section className="report-section" id="expensive-report">
                        <h2>🔝 Más Caras</h2>
                        <div className="expensive-list">
                            {topExpensive.map((sub, idx) => (
                                <div key={sub.id} className="expensive-item">
                                    <span className="rank">{idx + 1}</span>
                                    <span className="icon">{sub.icon}</span>
                                    <div className="details">
                                        <div className="name">{sub.service_name}</div>
                                        <div className="billing">{sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}</div>
                                    </div>
                                    <span className="price">{symbol}{sub.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Upcoming Renewals */}
                <section className="report-section" id="upcoming-report">
                    <h2>🔔 Próximas Renovaciones</h2>
                    <div className="upcoming-list">
                        {upcoming.length > 0 ? (
                            upcoming.map((sub) => {
                                const renewal = new Date(sub.next_renewal);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

                                return (
                                    <div key={sub.id} className="upcoming-item">
                                        <span className="icon">{sub.icon}</span>
                                        <div className="upcoming-details">
                                            <div className="name">{sub.service_name}</div>
                                            <div className="date">{sub.next_renewal}</div>
                                        </div>
                                        <div className={`days-left ${daysLeft <= 1 ? 'urgent' : daysLeft <= 7 ? 'warning' : ''}`}>
                                            {daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : `En ${daysLeft} días`}
                                        </div>
                                        <span className="price">{symbol}{sub.price.toFixed(2)}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="empty-text">No hay renovaciones próximas</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
