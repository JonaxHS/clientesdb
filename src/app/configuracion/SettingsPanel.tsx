'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPanel() {
    const router = useRouter();
    const [domain, setDomain] = useState('');
    const [ssl, setSsl] = useState(false);
    const [nginxConf, setNginxConf] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSslHelp, setShowSslHelp] = useState(false);
    const [showNginxConf, setShowNginxConf] = useState(false);

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
                setNginxConf(data.nginx);
                setStatus('✅ Configuración guardada. Reinicia Nginx para aplicar los cambios.');
                setShowNginxConf(true);
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
                <p className="settings-desc">Ingresa el dominio o IP que apunta a este servidor. Esto actualizará el archivo de configuración de Nginx automáticamente.</p>
                <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                    <label>Dominio / IP del servidor</label>
                    <input
                        type="text"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder="clientes.tudominio.com o 192.168.1.100"
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
                        <span>Habilitar SSL (HTTPS) — necesitas certbot activo</span>
                    </label>
                </div>
                {status && <p className="status-message" style={{ marginTop: '1rem' }}>{status}</p>}
                <button onClick={handleSave} disabled={loading} className="submit-button" style={{ marginTop: '1rem', width: '100%' }}>
                    {loading ? 'Guardando...' : '💾 Guardar y Actualizar Nginx'}
                </button>
            </div>

            {/* Restart Nginx instruction */}
            <div className="settings-card card">
                <h3>🔄 Aplicar Configuración de Nginx</h3>
                <p className="settings-desc">Después de guardar el dominio, reinicia Nginx en tu VPS para que los cambios surtan efecto:</p>
                <div className="code-block">
                    <code>docker compose restart nginx</code>
                </div>
                {showNginxConf && nginxConf && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <p className="settings-desc" style={{ marginBottom: '0.75rem' }}>📄 Config generada en <code>./nginx/default.conf</code>:</p>
                        <pre className="nginx-preview">{nginxConf}</pre>
                    </div>
                )}
                <button
                    onClick={() => setShowNginxConf(!showNginxConf)}
                    className="button-secondary btn-sm"
                    style={{ marginTop: '1rem' }}
                >
                    {showNginxConf ? 'Ocultar config' : '🔍 Ver config actual'}
                </button>
            </div>

            {/* SSL Section */}
            <div className="settings-card card">
                <div className="ssl-header" onClick={() => setShowSslHelp(!showSslHelp)} style={{ cursor: 'pointer' }}>
                    <h3>🔒 Certificado SSL (Certbot / Let&apos;s Encrypt)</h3>
                    <span className="chevron" style={{ transform: showSslHelp ? 'rotate(90deg)' : 'none' }}>›</span>
                </div>
                {showSslHelp && (
                    <div className="ssl-steps">
                        <p className="settings-desc">Para activar HTTPS gratis con Let&apos;s Encrypt, sigue estos pasos en tu VPS:</p>

                        <div className="ssl-step">
                            <span className="step-number">1</span>
                            <div>
                                <strong>Apunta tu dominio a este servidor</strong>
                                <p>En tu proveedor de DNS, crea un registro A que apunte a la IP de tu VPS.</p>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">2</span>
                            <div>
                                <strong>Asegúrate de que el puerto 80 sea accesible</strong>
                                <p>Cambia <code>3001:80</code> a <code>80:80</code> en el docker-compose.yml temporalmente, o abre los puertos en el firewall.</p>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">3</span>
                            <div>
                                <strong>Corre Certbot (reemplaza TU_DOMINIO)</strong>
                                <div className="code-block">
                                    <code>{`mkdir -p ./certbot/conf\ndocker run --rm -p 80:80 \\\n  -v $(pwd)/certbot/conf:/etc/letsencrypt \\\n  certbot/certbot certonly \\\n  --standalone \\\n  -d TU_DOMINIO \\\n  --email tu@email.com \\\n  --agree-tos`}</code>
                                </div>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">4</span>
                            <div>
                                <strong>Actualiza docker-compose.yml para montar los certs</strong>
                                <p>Agrega el volumen de certbot al servicio nginx en tu docker-compose.yml (ya está preparado) y reinicia:</p>
                                <div className="code-block">
                                    <code>docker compose down && docker compose up -d</code>
                                </div>
                            </div>
                        </div>

                        <div className="ssl-step">
                            <span className="step-number">5</span>
                            <div>
                                <strong>Activa SSL arriba ↑ y guarda</strong>
                                <p>Marca el checkbox de SSL, guarda, y reinicia nginx.</p>
                            </div>
                        </div>
                    </div>
                )}
                {!showSslHelp && <p className="settings-desc" style={{ marginTop: '0.5rem' }}>Haz clic para ver las instrucciones de configuración SSL.</p>}
            </div>
        </div>
    );
}
