'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Contraseña incorrecta');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card card">
                <div className="login-icon">🔐</div>
                <h2>Acceso Restringido</h2>
                <p className="login-subtitle">Ingresa la contraseña de administrador para continuar.</p>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Contraseña de administrador</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            required
                        />
                    </div>
                    {error && <p className="error-message">⚠️ {error}</p>}
                    <button type="submit" disabled={loading} className="submit-button full-width">
                        {loading ? 'Verificando...' : '🔓 Entrar'}
                    </button>
                </form>
                <a href="/" className="back-link-bottom">← Volver al inicio</a>
            </div>
        </div>
    );
}
