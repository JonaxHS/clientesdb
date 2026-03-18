'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
}) as React.ComponentType<{
    lat: number | null;
    lng: number | null;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    height?: string;
    clients?: { id: string, name: string | null, lat: number, lng: number }[];
    showUserLocation?: boolean;
}>;

export default function ClientForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [geoStatus, setGeoStatus] = useState('');
    const [showMap, setShowMap] = useState(true);

    const [providers, setProviders] = useState<{ id: string, name: string }[]>([]);
    const [allClients, setAllClients] = useState<any[]>([]);

    // Nueva estructura de estado
    const [formData, setFormData] = useState({
        name: '',
        domotics_notes: '',
        address: '',
        latitude: '', longitude: '',
        accounts: [] as { providerId: string, username: '', password: '', notes: '' }[]
    });

    useEffect(() => {
        const fetchData = async () => {
            const [pRes, cRes] = await Promise.all([
                fetch('/api/providers'),
                fetch('/api/clients')
            ]);
            if (pRes.ok) setProviders(await pRes.json());
            if (cRes.ok) setAllClients(await cRes.json());
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddAccount = () => {
        setFormData(prev => ({
            ...prev,
            accounts: [...prev.accounts, { providerId: '', username: '', password: '', notes: '' }]
        }));
    };

    const handleAccountChange = (index: number, field: string, value: string) => {
        const newAccounts = [...formData.accounts];
        (newAccounts[index] as any)[field] = value;
        setFormData({ ...formData, accounts: newAccounts });
    };

    const handleRemoveAccount = (index: number) => {
        const newAccounts = [...formData.accounts];
        newAccounts.splice(index, 1);
        setFormData({ ...formData, accounts: newAccounts });
    };

    const obtainAutoLocation = () => {
        if (!navigator.geolocation) {
            setGeoStatus('❌ Geolocalización no soportada. Usa el mapa.');
            setShowMap(true);
            return;
        }
        // Check if we're on HTTP (not HTTPS or localhost) - geolocation won't work
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecure) {
            setGeoStatus('⚠️ La detección automática requiere HTTPS. Selecciona en el mapa.');
            setShowMap(true);
            return;
        }
        setGeoStatus('📍 Obteniendo ubicación...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
                setGeoStatus('✅ ¡Ubicación detectada!');
            },
            () => {
                setGeoStatus('❌ Error. Selecciona tu ubicación en el mapa.');
                setShowMap(true);
            }
        );
    };

    const handleMapLocation = (lat: number, lng: number, address?: string) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
            address: address || prev.address
        }));
        setGeoStatus('✅ Ubicación seleccionada en mapa.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({
                    name: '', domotics_notes: '', address: '', latitude: '', longitude: '', accounts: []
                });
                setGeoStatus('');
                router.refresh();
                // Refresh clients list to show the new one as a marker next time
                const cRes = await fetch('/api/clients');
                if (cRes.ok) setAllClients(await cRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Client markers for the map
    const clientMarkers = allClients
        .filter(c => c.latitude && c.longitude)
        .map(c => ({ id: c.id, name: c.name, lat: c.latitude!, lng: c.longitude! }));

    return (
        <form onSubmit={handleSubmit} className="client-form">
            <div className="form-group full-width">
                <label>Nombre / Proyecto <span className="optional-tag">opcional</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Casa García, Oficina 3B..." />
            </div>

            <div className="accounts-section full-width card-inner" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>🔑 Cuentas y Credenciales</h3>
                    <button type="button" onClick={handleAddAccount} className="button-primary btn-sm" style={{ padding: '0.4rem 0.8rem' }}>
                        + Añadir Cuenta
                    </button>
                </div>

                {formData.accounts.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                        No hay cuentas agregadas. Haz clic en &quot;Añadir Cuenta&quot;.
                    </p>
                ) : (
                    formData.accounts.map((acc, idx) => (
                        <div key={idx} className="account-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => handleRemoveAccount(idx)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#fa5252', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                                title="Eliminar cuenta"
                            >×</button>

                            <div className="form-group full-width" style={{ marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.85rem' }}>Proveedor</label>
                                <select
                                    value={acc.providerId}
                                    onChange={e => handleAccountChange(idx, 'providerId', e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                    required
                                >
                                    <option value="" disabled>Selecciona un proveedor...</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Usuario / Email</label>
                                    <input type="text" value={acc.username} onChange={e => handleAccountChange(idx, 'username', e.target.value)} placeholder="usuario" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
                                    <input type="text" value={acc.password} onChange={e => handleAccountChange(idx, 'password', e.target.value)} placeholder="contraseña" />
                                </div>
                            </div>

                            <div className="form-group full-width" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Notas adicionales (opcional)</label>
                                <input type="text" value={acc.notes} onChange={e => handleAccountChange(idx, 'notes', e.target.value)} placeholder="PIN, Notas, etc." style={{ padding: '0.5rem' }} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="form-group full-width">
                <label>Notas Globales del Proyecto</label>
                <textarea name="domotics_notes" value={formData.domotics_notes} onChange={handleChange} rows={2} placeholder="Descripción general, equipos instalados..."></textarea>
            </div>

            <div className="location-section full-width card-inner">
                <div className="location-header">
                    <h3>📍 Geolocalización</h3>
                    <div className="location-actions">
                        <button type="button" onClick={() => setShowMap(!showMap)} className="button-secondary btn-sm">
                            {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                        </button>
                    </div>
                </div>

                {geoStatus && <p className="status-message">{geoStatus}</p>}

                <div className="form-group full-width" style={{ marginBottom: '1rem' }}>
                    <label>Dirección (autogenerada o manual)</label>
                    <input type="text" name="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle, ciudad..." />
                </div>

                <div className="form-row coords-preview">
                    <div className="form-group">
                        <label>Latitud</label>
                        <input type="text" name="latitude" readOnly value={formData.latitude} placeholder="Selecciona en el mapa" />
                    </div>
                    <div className="form-group">
                        <label>Longitud</label>
                        <input type="text" name="longitude" readOnly value={formData.longitude} placeholder="Selecciona en el mapa" />
                    </div>
                </div>

                {showMap && (
                    <div className="map-container-wrapper" style={{ height: '350px' }}>
                        <MapPicker
                            lat={formData.latitude ? parseFloat(formData.latitude) : null}
                            lng={formData.longitude ? parseFloat(formData.longitude) : null}
                            onLocationSelect={handleMapLocation}
                            clients={clientMarkers}
                            showUserLocation={true}
                            height="100%"
                        />
                    </div>
                )}
            </div>

            <button type="submit" disabled={loading} className="submit-button full-width">
                {loading ? 'Guardando...' : '💾 Guardar Cliente'}
            </button>
        </form>
    );
}
