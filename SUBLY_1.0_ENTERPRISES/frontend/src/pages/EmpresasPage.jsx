import { useState, useEffect, useCallback } from 'react';
import {
    getCompanies, createCompany, getCompanyDashboard, deleteCompanyApi,
    addCompanyExpense, deleteCompanyExpense,
    addCompanySub, updateCompanySub, deleteCompanySub
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import SubCard from '../components/SubCard';
import SubModal from '../components/SubModal';
import DeleteModal from '../components/DeleteModal';

export default function EmpresasPage() {
    const { user } = useAuth();

    // Vista: 'list' o 'detail'
    const [view, setView] = useState('list');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Detalle empresa
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Modal crear empresa
    const [createOpen, setCreateOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');

    // Modal eliminar empresa
    const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);
    const [deleteCompanyTarget, setDeleteCompanyTarget] = useState({ id: null, name: '' });

    // Modal gasto
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        name: '', amount: '', category: 'general', expense_date: new Date().toISOString().split('T')[0]
    });

    // Modal suscripción empresa
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [editSubData, setEditSubData] = useState(null);

    // Modal eliminar sub/gasto
    const [deleteItemOpen, setDeleteItemOpen] = useState(false);
    const [deleteItemTarget, setDeleteItemTarget] = useState({ type: '', id: null, name: '' });

    // Tabs: 'expenses' | 'subscriptions'
    const [activeTab, setActiveTab] = useState('expenses');

    // ─── Cargar lista de empresas ──────────────────────────────
    const loadCompanies = useCallback(async () => {
        try {
            const result = await getCompanies();
            setCompanies(result);
        } catch (err) {
            console.error('Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCompanies(); }, [loadCompanies]);

    // ─── Cargar detalle empresa ────────────────────────────────
    const loadCompanyDetail = useCallback(async (companyId) => {
        setDetailLoading(true);
        try {
            const result = await getCompanyDashboard(companyId);
            setCompanyData(result);
        } catch (err) {
            console.error('Error loading company:', err);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openDetail = (companyId) => {
        setSelectedCompanyId(companyId);
        setView('detail');
        setActiveTab('expenses');
        loadCompanyDetail(companyId);
    };

    const backToList = () => {
        setView('list');
        setSelectedCompanyId(null);
        setCompanyData(null);
        loadCompanies();
    };

    // ─── Crear empresa ─────────────────────────────────────────
    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;
        try {
            await createCompany(newCompanyName.trim());
            setCreateOpen(false);
            setNewCompanyName('');
            loadCompanies();
        } catch (err) {
            alert(err.message);
        }
    };

    // ─── Eliminar empresa ──────────────────────────────────────
    const handleDeleteCompanyClick = (id, name) => {
        setDeleteCompanyTarget({ id, name });
        setDeleteCompanyOpen(true);
    };

    const handleDeleteCompanyConfirm = async () => {
        try {
            await deleteCompanyApi(deleteCompanyTarget.id);
            setDeleteCompanyOpen(false);
            setDeleteCompanyTarget({ id: null, name: '' });
            loadCompanies();
        } catch (err) {
            alert(err.message);
        }
    };

    // ─── Gastos ────────────────────────────────────────────────
    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await addCompanyExpense(selectedCompanyId, {
                ...expenseForm,
                amount: parseFloat(expenseForm.amount)
            });
            setExpenseOpen(false);
            setExpenseForm({ name: '', amount: '', category: 'general', expense_date: new Date().toISOString().split('T')[0] });
            loadCompanyDetail(selectedCompanyId);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteExpenseClick = (id, name) => {
        setDeleteItemTarget({ type: 'expense', id, name });
        setDeleteItemOpen(true);
    };

    // ─── Suscripciones empresa ─────────────────────────────────
    const handleAddSub = () => {
        setEditSubData(null);
        setSubModalOpen(true);
    };

    const handleEditSub = async (id) => {
        const sub = companyData?.subscriptions?.find(s => s.id === id);
        if (sub) {
            setEditSubData(sub);
            setSubModalOpen(true);
        }
    };

    const handleSaveSub = async (formData) => {
        try {
            if (editSubData) {
                await updateCompanySub(selectedCompanyId, editSubData.id, formData);
            } else {
                await addCompanySub(selectedCompanyId, formData);
            }
            setSubModalOpen(false);
            setEditSubData(null);
            loadCompanyDetail(selectedCompanyId);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteSubClick = (id, name) => {
        setDeleteItemTarget({ type: 'subscription', id, name });
        setDeleteItemOpen(true);
    };

    const handleDeleteItemConfirm = async () => {
        try {
            if (deleteItemTarget.type === 'expense') {
                await deleteCompanyExpense(selectedCompanyId, deleteItemTarget.id);
            } else {
                await deleteCompanySub(selectedCompanyId, deleteItemTarget.id);
            }
            setDeleteItemOpen(false);
            setDeleteItemTarget({ type: '', id: null, name: '' });
            loadCompanyDetail(selectedCompanyId);
        } catch (err) {
            alert(err.message);
        }
    };

    // ─── Escape key ────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                setCreateOpen(false);
                setExpenseOpen(false);
                setSubModalOpen(false);
                setDeleteCompanyOpen(false);
                setDeleteItemOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    // ─── Loading state ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="app-container">
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cargando...</p>
                </main>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  COMPANY DETAIL VIEW
    // ═══════════════════════════════════════════════════════════
    if (view === 'detail') {
        const EXPENSE_CATEGORIES = [
            { value: 'general', label: '📋 General' },
            { value: 'software', label: '💻 Software' },
            { value: 'marketing', label: '📢 Marketing' },
            { value: 'infraestructura', label: '🏗️ Infraestructura' },
            { value: 'personal', label: '👥 Personal' },
            { value: 'oficina', label: '🏢 Oficina' },
            { value: 'viajes', label: '✈️ Viajes' },
            { value: 'otros', label: '📦 Otros' },
        ];

        return (
            <div className="app-container">
                <Sidebar />
                <main className="main-content">
                    {/* Back Button */}
                    <button className="back-btn" onClick={backToList} id="back-to-companies">
                        ← Volver a Empresas
                    </button>

                    {detailLoading ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', textAlign: 'center', marginTop: '60px' }}>Cargando empresa...</p>
                    ) : companyData ? (
                        <>
                            {/* Company Header */}
                            <div className="company-detail-header">
                                <div className="company-detail-avatar">
                                    {companyData.company.name[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="greeting">{companyData.company.name}</h1>
                                    <p className="greeting-sub">Dashboard de la empresa</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="stats-grid" id="company-stats">
                                <div className="stat-card stat-card-1">
                                    <div className="stat-icon">💸</div>
                                    <div className="stat-info">
                                        <span className="stat-label">Gastos Totales</span>
                                        <span className="stat-value">{companyData.total_expenses.toFixed(2)}€</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-2">
                                    <div className="stat-icon">💳</div>
                                    <div className="stat-info">
                                        <span className="stat-label">Suscripciones / mes</span>
                                        <span className="stat-value">{companyData.total_subs_monthly.toFixed(2)}€</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-3">
                                    <div className="stat-icon">⚡</div>
                                    <div className="stat-info">
                                        <span className="stat-label">Subs Activas</span>
                                        <span className="stat-value">{companyData.active_subs}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="empresa-tabs">
                                <button
                                    className={`empresa-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('expenses')}
                                    id="tab-expenses"
                                >
                                    💸 Gastos ({companyData.expenses.length})
                                </button>
                                <button
                                    className={`empresa-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('subscriptions')}
                                    id="tab-subscriptions"
                                >
                                    🔄 Suscripciones ({companyData.subscriptions.length})
                                </button>
                            </div>

                            {/* EXPENSES TAB */}
                            {activeTab === 'expenses' && (
                                <>
                                    <div className="content-header" style={{ marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gastos</h2>
                                        <button className="btn btn-primary" onClick={() => setExpenseOpen(true)} id="add-expense-btn">
                                            <span>+</span> Nuevo Gasto
                                        </button>
                                    </div>

                                    {companyData.expenses.length > 0 ? (
                                        <div className="expenses-table-wrap">
                                            <table className="expenses-table" id="expenses-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Categoría</th>
                                                        <th>Monto</th>
                                                        <th>Fecha</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {companyData.expenses.map(exp => (
                                                        <tr key={exp.id}>
                                                            <td className="expense-name">{exp.name}</td>
                                                            <td>
                                                                <span className="expense-category-badge">{exp.category}</span>
                                                            </td>
                                                            <td className="expense-amount">{exp.amount.toFixed(2)}€</td>
                                                            <td className="expense-date">{exp.expense_date}</td>
                                                            <td>
                                                                <button
                                                                    className="sub-action-btn sub-action-delete"
                                                                    onClick={() => handleDeleteExpenseClick(exp.id, exp.name)}
                                                                    title="Eliminar"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📋</div>
                                            <h3>Sin gastos registrados</h3>
                                            <p>Añade el primer gasto de esta empresa</p>
                                            <button className="btn btn-primary" onClick={() => setExpenseOpen(true)}>+ Añadir Gasto</button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* SUBSCRIPTIONS TAB */}
                            {activeTab === 'subscriptions' && (
                                <>
                                    <div className="content-header" style={{ marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Suscripciones</h2>
                                        <button className="btn btn-primary" onClick={handleAddSub} id="add-company-sub-btn">
                                            <span>+</span> Nueva Suscripción
                                        </button>
                                    </div>

                                    {companyData.subscriptions.length > 0 ? (
                                        <div className="subs-grid" id="company-subs-grid">
                                            {companyData.subscriptions.map(sub => (
                                                <SubCard
                                                    key={sub.id}
                                                    sub={sub}
                                                    onEdit={handleEditSub}
                                                    onDelete={handleDeleteSubClick}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">🔄</div>
                                            <h3>Sin suscripciones</h3>
                                            <p>Añade suscripciones a esta empresa</p>
                                            <button className="btn btn-primary" onClick={handleAddSub}>+ Añadir Suscripción</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '60px' }}>Error al cargar la empresa</p>
                    )}

                    {/* Expense Modal */}
                    {expenseOpen && (
                        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setExpenseOpen(false); }}>
                            <div className="modal" id="expense-modal">
                                <div className="modal-header">
                                    <h2>Nuevo Gasto</h2>
                                    <button className="modal-close" onClick={() => setExpenseOpen(false)}>×</button>
                                </div>
                                <form onSubmit={handleAddExpense} id="expense-form">
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label htmlFor="expense_name">Nombre del gasto</label>
                                        <input
                                            type="text" id="expense_name" placeholder="Ej: Licencia Adobe"
                                            required value={expenseForm.name}
                                            onChange={e => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row" style={{ marginBottom: '14px' }}>
                                        <div className="form-group flex-1">
                                            <label htmlFor="expense_amount">Monto (€)</label>
                                            <input
                                                type="number" id="expense_amount" placeholder="99.99" step="0.01" min="0"
                                                required value={expenseForm.amount}
                                                onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label htmlFor="expense_category">Categoría</label>
                                            <select
                                                id="expense_category" value={expenseForm.category}
                                                onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                            >
                                                {EXPENSE_CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label htmlFor="expense_date_input">Fecha</label>
                                        <input
                                            type="date" id="expense_date_input" required
                                            value={expenseForm.expense_date}
                                            onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setExpenseOpen(false)}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" id="save-expense-btn">Guardar Gasto</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Sub Modal (reused) */}
                    <SubModal
                        isOpen={subModalOpen}
                        onClose={() => { setSubModalOpen(false); setEditSubData(null); }}
                        onSave={handleSaveSub}
                        editData={editSubData}
                    />

                    {/* Delete Item Modal */}
                    <DeleteModal
                        isOpen={deleteItemOpen}
                        serviceName={deleteItemTarget.name}
                        onClose={() => setDeleteItemOpen(false)}
                        onConfirm={handleDeleteItemConfirm}
                    />
                </main>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  COMPANY LIST VIEW
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {/* Header */}
                <div className="content-header">
                    <div>
                        <h1 className="greeting">Empresas 🏢</h1>
                        <p className="greeting-sub">Gestiona los gastos y suscripciones de cada empresa</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCreateOpen(true)} id="add-company-btn">
                        <span>+</span> Nueva Empresa
                    </button>
                </div>

                {/* Company Cards */}
                {companies.length > 0 ? (
                    <div className="companies-grid" id="companies-grid">
                        {companies.map(c => (
                            <div className="company-card" key={c.id} onClick={() => openDetail(c.id)}>
                                <div className="company-card-header">
                                    <div className="company-avatar">
                                        {c.name[0]?.toUpperCase()}
                                    </div>
                                    <button
                                        className="sub-action-btn sub-action-delete company-delete-btn"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCompanyClick(c.id, c.name); }}
                                        title="Eliminar empresa"
                                        id={`delete-company-${c.id}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <h3 className="company-name">{c.name}</h3>
                                <div className="company-stats-row">
                                    <div className="company-mini-stat">
                                        <span className="company-mini-label">Gastos</span>
                                        <span className="company-mini-value">{c.total_expenses.toFixed(2)}€</span>
                                    </div>
                                    <div className="company-mini-stat">
                                        <span className="company-mini-label">Subs/mes</span>
                                        <span className="company-mini-value">{c.total_subs_monthly.toFixed(2)}€</span>
                                    </div>
                                    <div className="company-mini-stat">
                                        <span className="company-mini-label">Activas</span>
                                        <span className="company-mini-value">{c.active_subs}</span>
                                    </div>
                                </div>
                                <div className="company-card-footer">
                                    <span>Ver detalles →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" id="empty-companies">
                        <div className="empty-icon">🏢</div>
                        <h3>No tienes empresas aún</h3>
                        <p>Añade tu primera empresa para gestionar sus gastos y suscripciones</p>
                        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Añadir Empresa</button>
                    </div>
                )}

                {/* Create Company Modal */}
                {createOpen && (
                    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setCreateOpen(false); }}>
                        <div className="modal modal-sm" id="create-company-modal">
                            <div className="modal-header">
                                <h2>Nueva Empresa</h2>
                                <button className="modal-close" onClick={() => setCreateOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateCompany} id="create-company-form">
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label htmlFor="company_name">Nombre de la empresa</label>
                                    <input
                                        type="text" id="company_name"
                                        placeholder="Ej: Mi Startup SL"
                                        required autoFocus
                                        value={newCompanyName}
                                        onChange={e => setNewCompanyName(e.target.value)}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary" id="save-company-btn">Crear Empresa</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Company Modal */}
                <DeleteModal
                    isOpen={deleteCompanyOpen}
                    serviceName={deleteCompanyTarget.name}
                    onClose={() => setDeleteCompanyOpen(false)}
                    onConfirm={handleDeleteCompanyConfirm}
                />
            </main>
        </div>
    );
}
