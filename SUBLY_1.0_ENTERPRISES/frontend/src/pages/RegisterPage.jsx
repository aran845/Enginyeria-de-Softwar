import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/api';
import FlashMessage from '../components/FlashMessage';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            const data = await registerUser(name, email, password);
            login(data.token, data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
                <div className="auth-orb auth-orb-3"></div>
            </div>

            {error && <FlashMessage message={error} type="error" />}

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">S</div>
                    <h1>Subly</h1>
                    <p className="auth-subtitle">Crea tu cuenta gratuita</p>
                </div>

                <form className="auth-form" id="register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nombre</label>
                        <div className="input-wrapper">
                            <span className="input-icon">👤</span>
                            <input type="text" id="name" placeholder="Tu nombre" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉</span>
                            <input type="email" id="email" placeholder="tu@email.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input type="password" id="password" placeholder="Mínimo 6 caracteres" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirmar Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input type="password" id="confirm_password" placeholder="Repite la contraseña" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" id="register-btn">
                        Crear Cuenta
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
                </div>
            </div>
        </div>
    );
}
