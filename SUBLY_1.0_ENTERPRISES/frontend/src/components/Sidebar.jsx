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

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-logo">
                    <div className="logo-icon">S</div>
                    <span className="logo-text">Subly</span>
                </div>
                <nav className="sidebar-nav">
                    <a
                        href="#"
                        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                        id="nav-dashboard"
                        onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
                    >
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </a>
                    <a
                        href="#"
                        className={`nav-item ${isActive('/empresas') ? 'active' : ''}`}
                        id="nav-empresas"
                        onClick={(e) => { e.preventDefault(); navigate('/empresas'); }}
                    >
                        <span className="nav-icon">🏢</span>
                        <span>Empresas</span>
                    </a>
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
