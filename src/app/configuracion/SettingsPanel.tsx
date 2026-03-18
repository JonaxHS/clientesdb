'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPanel() {
    const router = useRouter();
    const [domain, setDomain] = useState('');
    const [ssl, setSsl] = useState(false);
    const [caddyConf, setCaddyConf] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSslHelp, setShowSslHelp] = useState(false);
    const [showCaddyConf, setShowCaddyConf] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/configuracion');
            if (res.ok) {
                const data = await res.json();
                setDomain(data.domain || '');
                setSsl(data.ssl_enabled === 'true');
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const handleSave = async () => {
        setLoading(true);
        setStatus('');
        try {
            const res = await fetch('/api/configuracion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, ssl_enabled: ssl }),
            });
            const data = await res.json();
            if (data.ok) {
                setCaddyConf(data.caddyConf);
                setStatus('✅ Configuración guardada. Reinicia Caddy para aplicar los cambios.');
                setShowCaddyConf(true);
            } else {
                setStatus('❌ Error al guardar.');
            }
        } catch {
            setStatus('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth', { method: 'DELETE' });
        router.refresh();
    };

    return (
        <div className="settings-wrapper">
            <div className="settings-topbar">
                <a href="/" className="button-secondary btn-sm">← Clientes</a>
                <button onClick={handleLogout} className="button-secondary btn-sm logout-btn">🚪 Cerrar sesión</button>
            </div>

            {/* Domain Section */}
            <div className="settings-card card">
                <h3>🌐 Dominio</h3>
                <p className="settings-desc">Ingresa el dominio o IP que apunta a este servidor. Esto actualizará el archivo de configuración de Caddy automáticamente.</p>
                <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                    <label>Dominio / IP del servidor</label>
                    <input
                        type="text"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder="clientes.tudominio.com"
                    />
                </div>
                <div className="ssl-row">
                    <label className="ssl-label">
                        <input
                            type="checkbox"
                            checked={ssl}
                            onChange={e => setSsl(e.target.checked)}
                            className="ssl-checkbox"
                        />
                        <span>Habilitar SSL Automático (Caddy generará los certificados por ti)</span>
                    </label>
                </div>
                {status && <p className="status-message" style={{ marginTop: '1rem' }}>{status}</p>}
                <button onClick={handleSave} disabled={loading} className="submit-button" style={{ marginTop: '1rem', width: '100%' }}>
                    {loading ? 'Guardando...' : '💾 Guardar y Actualizar Caddy'}
                </button>
            </div>

            {/* Restart Caddy instruction */}
            <div className="settings-card card">
                <h3>🔄 Aplicar Configuración</h3>
                <p className="settings-desc">Después de guardar el dominio, reinicia el servidor para que los cambios surtan efecto:</p>
                <div className="code-block">
                    <code>docker compose restart caddy</code>
                </div>
                {showCaddyConf && caddyConf && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <p className="settings-desc" style={{ marginBottom: '0.75rem' }}>📄 Caddyfile generado en <code>./caddy/Caddyfile</code>:</p>
                        <pre className="nginx-preview">{caddyConf}</pre>
                    </div>
                )}
                <button
                    onClick={() => setShowCaddyConf(!showCaddyConf)}
                    className="button-secondary btn-sm"
                    style={{ marginTop: '1rem' }}
                >
                    {showCaddyConf ? 'Ocultar config' : '🔍 Ver config actual'}
                </button>
            </div>

            <div className="settings-card card">
                <div className="ssl-header" onClick={() => setShowSslHelp(!showSslHelp)} style={{ cursor: 'pointer' }}>
                    <h3>🔒 SSL Automático (Caddy ✨)</h3>
                    <span className="chevron" style={{ transform: showSslHelp ? 'rotate(90deg)' : 'none' }}>›</span>
                </div>
                {showSslHelp && (
                    <div className="ssl-steps">
                        <p className="settings-desc">Caddy se encarga de contactar a Let&apos;s Encrypt y generar los certificados por ti automáticamente. Solo asegúrate de:</p>

                        <div className="ssl-step">
                            <span className="step-number">1</span>
                            <div>
                                <strong>Tu dominio debe apuntar a la IP de este VPS</strong>
                                <p>Crea el registro tipo &quot;A&quot; en tu proveedor DNS y espera a que propague.</p>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">2</span>
                            <div>
                                <strong>Los puertos 80 y 443 deben estar abiertos</strong>
                                <p>Caddy usa el puerto 80 para validar que eres el dueño del dominio antes de activar el 443.</p>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">3</span>
                            <div>
                                <strong>Activa SSL Arriba ↑ y Reinicia</strong>
                                <p>Marca la casilla &quot;Habilitar SSL&quot; y guarda. Luego ejecuta <code>docker compose restart caddy</code> en tu VPS.</p>
                            </div>
                        </div>
                    </div>
                )}
                {!showSslHelp && <p className="settings-desc" style={{ marginTop: '0.5rem' }}>Haz clic para ver cómo funciona el SSL automático.</p>}
            </div>
        </div>
    );
}
