import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-logo">
                    <div className="logo-icon">S</div>
                    <span className="logo-text">Subly</span>
                </div>
                <nav className="sidebar-nav">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                        id="nav-dashboard"
                    >
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/reports')}
                        className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
                        id="nav-reports"
                    >
                        <span className="nav-icon">📈</span>
                        <span>Reportes</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                        id="nav-settings"
                    >
                        <span className="nav-icon">⚙️</span>
                        <span>Configuración</span>
                    </button>
                </nav>
            </div>
            <div className="sidebar-bottom">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                </div>
                <button className="logout-btn" id="logout-btn" onClick={handleLogout}>
                    Salir
                </button>
            </div>
        </aside>
    );
}
