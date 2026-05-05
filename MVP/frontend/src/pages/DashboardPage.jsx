import { useState, useEffect, useCallback } from 'react';
import { getDashboard, createSubscription, getSubscription, updateSubscription, deleteSubscriptionApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatsGrid from '../components/StatsGrid';
import SubCard from '../components/SubCard';
import SubModal from '../components/SubModal';
import DeleteModal from '../components/DeleteModal';

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '' });

    const loadDashboard = useCallback(async () => {
        try {
            const result = await getDashboard();
            setData(result);
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Keyboard handler for Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                setModalOpen(false);
                setDeleteOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    const handleAdd = () => {
        setEditData(null);
        setModalOpen(true);
    };

    const handleEdit = async (id) => {
        try {
            const sub = await getSubscription(id);
            setEditData(sub);
            setModalOpen(true);
        } catch {
            alert('Error al cargar la suscripción');
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editData) {
                await updateSubscription(editData.id, formData);
            } else {
                await createSubscription(formData);
            }
            setModalOpen(false);
            setEditData(null);
            loadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteClick = (id, name) => {
        setDeleteTarget({ id, name });
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSubscriptionApi(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget({ id: null, name: '' });
            loadDashboard();
        } catch {
            alert('Error al eliminar');
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cargando...</p>
                </main>
            </div>
        );
    }

    // Calcular días restantes para cada suscripción
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysLeft = (dateStr) => {
        const renewal = new Date(dateStr + 'T00:00:00');
        return Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
    };

    // Suscripciones urgentes (0-1 día) y próximas (2-7 días)
    const urgentSubs = (data?.subscriptions || []).filter(s => s.is_active && getDaysLeft(s.next_renewal) <= 1 && getDaysLeft(s.next_renewal) >= 0);
    const warningSubs = (data?.subscriptions || []).filter(s => s.is_active && getDaysLeft(s.next_renewal) > 1 && getDaysLeft(s.next_renewal) <= 7);

    return (
        <div className="app-container">
            {/* Decorative Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <Sidebar />

            <main className="main-content">
                {/* Header */}
                <div className="content-header">
                    <div>
                        <h1 className="greeting">Hola, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="greeting-sub">Aquí tienes el resumen de tus suscripciones</p>
                    </div>
                    <button className="btn btn-primary" id="add-subscription-btn" onClick={handleAdd}>
                        <span>+</span> Nueva Suscripción
                    </button>
                </div>

                {/* Urgent Alert (red) — renewing in 0-1 days */}
                {urgentSubs.length > 0 && (
                    <div className="alert-banner alert-urgent" id="urgent-alerts">
                        <span className="alert-icon">🚨</span>
                        <span>
                            <strong>¡Atención!</strong>{' '}
                            {urgentSubs.map(s => s.service_name).join(', ')} se {urgentSubs.length === 1 ? 'renueva' : 'renuevan'} {urgentSubs.some(s => getDaysLeft(s.next_renewal) === 0) ? 'hoy' : 'mañana'}
                        </span>
                    </div>
                )}

                {/* Warning Alert (orange) — renewing in 2-7 days */}
                {warningSubs.length > 0 && (
                    <div className="alert-banner alert-warning" id="alerts-section">
                        <span className="alert-icon">🔔</span>
                        <span>
                            {warningSubs.length} renovación{warningSubs.length > 1 ? 'es' : ''} en los próximos 7 días
                        </span>
                    </div>
                )}

                {/* Stats */}
                <StatsGrid
                    monthlyTotal={data?.monthly_total || 0}
                    yearlyTotal={data?.yearly_total || 0}
                    activeCount={data?.active_count || 0}
                />

                {/* Subscriptions Section */}
                <div className="section-header">
                    <h2>Mis Suscripciones</h2>
                </div>

                {data?.subscriptions?.length > 0 ? (
                    <div className="subs-grid" id="subs-grid">
                        {data.subscriptions.map((sub) => (
                            <SubCard
                                key={sub.id}
                                sub={sub}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" id="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No tienes suscripciones aún</h3>
                        <p>Añade tu primera suscripción para empezar a controlar tus gastos</p>
                        <button className="btn btn-primary" onClick={handleAdd}>+ Añadir Suscripción</button>
                    </div>
                )}
            </main>

            {/* Modals */}
            <SubModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditData(null); }}
                onSave={handleSave}
                editData={editData}
            />
            <DeleteModal
                isOpen={deleteOpen}
                serviceName={deleteTarget.name}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
