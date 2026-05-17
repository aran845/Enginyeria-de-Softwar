import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { triggerNotifications } from '../api/api';
import Sidebar from '../components/Sidebar';

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings, getCurrencySymbol } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulateResult, setSimulateResult] = useState('');

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (field, value) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        console.log('💾 Guardando settings:', localSettings);
        const success = await updateSettings(localSettings);
        setSaving(false);
        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            alert('Error al guardar la configuración');
        }
    };

    const handleSimulate = async () => {
        setSimulating(true);
        setSimulateResult('');
        try {
            const res = await triggerNotifications();
            setSimulateResult(res.messages?.join(' | ') || res.message || 'Simulación completada');
        } catch (error) {
            setSimulateResult(`Error: ${error.message}`);
        }
        setSimulating(false);
        setTimeout(() => setSimulateResult(''), 5000);
    };

    return (
        <div className="app-container">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <Sidebar />

            <main className="main-content">
                {/* Header */}
                <div className="content-header">
                    <h1 className="greeting">⚙️ Configuración</h1>
                    <p className="greeting-sub">Personaliza tu experiencia</p>
                </div>

                <div className="settings-container" id="settings-container">
                    {/* Profile Section */}
                    <section className="settings-section" id="profile-section">
                        <h2>👤 Perfil</h2>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label>Nombre</label>
                                <input type="text" value={user?.name || ''} disabled />
                            </div>
                            <div className="setting-item">
                                <label>Email</label>
                                <input type="email" value={user?.email || ''} disabled />
                            </div>
                        </div>
                    </section>

                    {/* Notifications Section */}
                    <section className="settings-section" id="notifications-section">
                        <h2>🔔 Notificaciones</h2>
                        <div className="settings-group">
                            <div className="setting-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.email_notifications}
                                        onChange={(e) => handleChange('email_notifications', e.target.checked)}
                                    />
                                    <span className="toggle-label">Notificaciones por Email</span>
                                </label>
                                <span className="setting-description">Recibe notificaciones de renovaciones por email</span>
                            </div>

                            <div className="setting-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.renewal_alerts}
                                        onChange={(e) => handleChange('renewal_alerts', e.target.checked)}
                                    />
                                    <span className="toggle-label">Alertas de Renovación</span>
                                </label>
                                <span className="setting-description">Alerta 7 días antes de cada renovación (por email)</span>
                            </div>

                            <div className="setting-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.monthly_report}
                                        onChange={(e) => handleChange('monthly_report', e.target.checked)}
                                    />
                                    <span className="toggle-label">Reporte Mensual</span>
                                </label>
                                <span className="setting-description">Recibe un resumen mensual de tu gasto por email</span>
                            </div>

                            <div className="setting-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.budget_alert}
                                        onChange={(e) => handleChange('budget_alert', e.target.checked)}
                                    />
                                    <span className="toggle-label">Alerta de Presupuesto</span>
                                </label>
                                <span className="setting-description">Mostrar alerta cuando se intenta superar el presupuesto</span>
                            </div>
                        </div>
                    </section>

                    {/* Budget Section */}
                    <section className="settings-section" id="budget-section">
                        <h2>💰 Presupuesto Mensual</h2>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label htmlFor="budgetLimit">Límite Mensual de Presupuesto ({getCurrencySymbol()})</label>
                                <input
                                    type="number"
                                    id="budgetLimit"
                                    min="0"
                                    step="10"
                                    value={localSettings.budget_limit}
                                    onChange={(e) => handleChange('budget_limit', parseFloat(e.target.value) || 0)}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                    ⚠️ Se mostrará una alerta al agregar suscripciones que superen este límite
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* Currency Section */}
                    <section className="settings-section" id="currency-section">
                        <h2>💱 Moneda</h2>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label htmlFor="currency">Moneda para mostrar precios</label>
                                <select
                                    id="currency"
                                    value={localSettings.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">Dólar ($)</option>
                                    <option value="GBP">Libra (£)</option>
                                </select>
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Los precios se mostrarán con el símbolo de moneda seleccionado en toda la aplicación
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="settings-section" id="appearance-section">
                        <h2>🎨 Apariencia</h2>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label htmlFor="theme">Tema</label>
                                <select
                                    id="theme"
                                    value={localSettings.theme}
                                    onChange={(e) => handleChange('theme', e.target.value)}
                                >
                                    <option value="dark">Oscuro</option>
                                    <option value="light">Claro</option>
                                </select>
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Cambia el tema de la aplicación. Los cambios se aplican inmediatamente al guardar.
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* Save & Simulate Buttons */}
                    <div className="settings-actions" id="settings-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {simulateResult && (
                                <div style={{ fontSize: '0.85rem', color: simulateResult.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
                                    {simulateResult}
                                </div>
                            )}
                            <button
                                className="btn btn-secondary"
                                onClick={handleSimulate}
                                disabled={simulating}
                            >
                                {simulating ? '⏳ Simulando...' : '📧 Simular Envío de Emails'}
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {saved && (
                                <div className="save-message" id="save-message">
                                    ✓ Configuración guardada correctamente
                                </div>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                                id="save-settings-btn"
                            >
                                {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
