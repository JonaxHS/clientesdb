'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

// --- Types ---
interface Account {
    id: string;
    username: string | null;
    password: string | null;
    notes: string | null;
    provider: { id: string; name: string; };
}

interface Client {
    id: string;
    name: string | null;
    domotics_notes: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    accounts: Account[];
}

interface ClientWithDistance extends Client {
    distance?: number;
}

interface Provider { id: string; name: string; }

type EditAccount = { providerId: string; username: string; password: string; notes: string; };

// --- Haversine formula ---
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Edit Modal ---
function EditModal({ client, providers, onClose, onSaved }: {
    client: Client;
    providers: Provider[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(client.name || '');
    const [notes, setNotes] = useState(client.domotics_notes || '');
    const [lat, setLat] = useState(client.latitude?.toString() || '');
    const [lng, setLng] = useState(client.longitude?.toString() || '');
    const [showMap, setShowMap] = useState(false);
    const [accounts, setAccounts] = useState<EditAccount[]>(
        client.accounts.map(a => ({
            providerId: a.provider.id,
            username: a.username || '',
            password: a.password || '',
            notes: a.notes || ''
        }))
    );
    const [saving, setSaving] = useState(false);

    const addAccount = () => setAccounts(prev => [...prev, { providerId: '', username: '', password: '', notes: '' }]);
    const removeAccount = (i: number) => setAccounts(prev => prev.filter((_, idx) => idx !== i));
    const changeAccount = (i: number, field: keyof EditAccount, value: string) => {
        const next = [...accounts];
        next[i] = { ...next[i], [field]: value };
        setAccounts(next);
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: client.id,
                name,
                domotics_notes: notes,
                latitude: lat,
                longitude: lng,
                accounts
            })
        });
        setSaving(false);
        if (res.ok) { onSaved(); onClose(); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>✏️ Editar cliente</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group full-width">
                        <label>Nombre / Proyecto</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Casa García..." />
                    </div>

                    <div className="accounts-section full-width card-inner" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>🔑 Cuentas</span>
                            <button type="button" onClick={addAccount} className="button-primary btn-sm">+ Añadir</button>
                        </div>
                        {accounts.length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin cuentas.</p>}
                        {accounts.map((acc, idx) => (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', position: 'relative' }}>
                                <button onClick={() => removeAccount(idx)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                                <select value={acc.providerId} onChange={e => changeAccount(idx, 'providerId', e.target.value)}
                                    style={{ width: '100%', marginBottom: '0.4rem', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    <option value="" disabled>Selecciona proveedor...</option>
                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <div className="form-row" style={{ gap: '0.5rem' }}>
                                    <input value={acc.username} onChange={e => changeAccount(idx, 'username', e.target.value)} placeholder="Usuario" style={{ flex: 1 }} />
                                    <input value={acc.password} onChange={e => changeAccount(idx, 'password', e.target.value)} placeholder="Contraseña" style={{ flex: 1 }} />
                                </div>
                                <input value={acc.notes} onChange={e => changeAccount(idx, 'notes', e.target.value)} placeholder="Notas (PIN, etc.)" style={{ width: '100%', marginTop: '0.4rem' }} />
                            </div>
                        ))}
                    </div>

                    <div className="form-group full-width">
                        <label>Notas globales</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="WiFi, descripción..." />
                    </div>

                    <div className="form-group full-width">
                        <button type="button" className="button-secondary btn-sm" onClick={() => setShowMap(v => !v)}>
                            {showMap ? 'Ocultar mapa' : '🗺️ Cambiar ubicación'}
                        </button>
                    </div>
                    {showMap && (
                        <div style={{ height: '250px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <MapPicker
                                lat={lat ? parseFloat(lat) : null}
                                lng={lng ? parseFloat(lng) : null}
                                onLocationSelect={(la, ln) => { setLat(la.toString()); setLng(ln.toString()); }}
                            />
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="button-secondary">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="submit-button" style={{ flex: 1 }}>
                        {saving ? 'Guardando...' : '💾 Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Card component ---
function ClientCard({ client, onEdit, onDelete }: {
    client: ClientWithDistance;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);

    const title = client.name ||
        (client.accounts.length > 0 ? client.accounts[0].username : null) ||
        `Cliente ${client.id.slice(0, 6)}`;

    const date = new Date(client.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const hasLocation = client.latitude && client.longitude;
    const distLabel = client.distance !== undefined
        ? (client.distance < 1 ? `${Math.round(client.distance * 1000)} m` : `${client.distance.toFixed(1)} km`)
        : null;

    return (
        <div className={`client-item ${open ? 'open' : ''}`}>
            <button type="button" className="client-header" onClick={() => setOpen(!open)}>
                <div className="client-title-row">
                    <span className="client-icon">🏠</span>
                    <span className="client-name">{title}</span>
                </div>
                <div className="client-meta">
                    <span className="client-date">{date}</span>
                    {distLabel && <span className="distance-badge">📍 {distLabel}</span>}
                    {hasLocation && !distLabel && <span className="location-badge">📍</span>}
                    <span className={`chevron ${open ? 'up' : ''}`}>›</span>
                </div>
            </button>

            {open && (
                <div className="client-details">
                    {client.accounts.map(acc => (
                        <div key={acc.id} className="detail-group" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #334155' }}>
                            <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.2rem', color: '#3B82F6', fontSize: '0.85rem' }}>
                                🏷️ {acc.provider.name}
                            </span>
                            <span className="value" style={{ display: 'block' }}>
                                {acc.username || '-'} / <code>{acc.password || '-'}</code>
                            </span>
                            {acc.notes && <span className="value" style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>{acc.notes}</span>}
                        </div>
                    ))}
                    {client.domotics_notes && (
                        <div className="detail-group">
                            <span className="label">📝 Notas</span>
                            <span className="value">{client.domotics_notes}</span>
                        </div>
                    )}
                    {hasLocation && (
                        <div className="detail-group">
                            <span className="label">📍 Ubicación</span>
                            <a href={`https://www.openstreetmap.org/?mlat=${client.latitude}&mlon=${client.longitude}#map=18/${client.latitude}/${client.longitude}`}
                                target="_blank" rel="noopener noreferrer" className="map-link button-secondary btn-sm">
                                Ver en Mapa 🗺️
                            </a>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="card-actions">
                        <button className="btn-edit" onClick={onEdit}>✏️ Editar</button>
                        <button className="btn-delete" onClick={onDelete}>🗑️ Eliminar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main List ---
export default function ClientList() {
    const [allClients, setAllClients] = useState<ClientWithDistance[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'found' | 'denied'>('idle');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const NEARBY_RADIUS_KM = 5;

    const fetchAll = useCallback(async () => {
        try {
            const [clientsRes, provRes] = await Promise.all([
                fetch('/api/clients'),
                fetch('/api/providers')
            ]);
            if (clientsRes.ok) setAllClients(await clientsRes.json());
            if (provRes.ok) setProviders(await provRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!navigator.geolocation) { setGeoStatus('denied'); setShowAll(true); return; }
        setGeoStatus('locating');
        navigator.geolocation.getCurrentPosition(
            pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('found'); },
            () => { setGeoStatus('denied'); setShowAll(true); },
            { timeout: 10000 }
        );
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return;
        const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchAll();
        else alert('No se pudo eliminar.');
    };

    const clientsWithDistance: ClientWithDistance[] = userLocation
        ? allClients.map(c => ({
            ...c,
            distance: (c.latitude && c.longitude)
                ? getDistanceKm(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
                : undefined
        })).sort((a, b) => {
            if (a.distance === undefined && b.distance === undefined) return 0;
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return a.distance - b.distance;
        })
        : allClients;

    const locationFiltered = showAll || !userLocation
        ? clientsWithDistance
        : clientsWithDistance.filter(c => c.distance === undefined || c.distance <= NEARBY_RADIUS_KM);

    const query = searchQuery.toLowerCase().trim();
    const displayed = query
        ? locationFiltered.filter(c => (c.name?.toLowerCase().includes(query)) || (c.domotics_notes?.toLowerCase().includes(query)))
        : locationFiltered;

    const nearbyCount = userLocation
        ? clientsWithDistance.filter(c => c.distance !== undefined && c.distance <= NEARBY_RADIUS_KM).length
        : 0;

    return (
        <div className="clients-list-wrapper">
            {geoStatus === 'locating' && <div className="geo-banner geo-locating">📡 Obteniendo tu ubicación...</div>}
            {geoStatus === 'found' && !showAll && (
                <div className="geo-banner geo-found">📍 {nearbyCount} clientes cerca de ti (radio {NEARBY_RADIUS_KM} km)</div>
            )}
            {geoStatus === 'denied' && <div className="geo-banner geo-denied">⚠️ Sin acceso a ubicación — mostrando todos</div>}

            <div className="list-controls">
                <input type="text" className="search-input" placeholder="🔍 Buscar por nombre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {geoStatus === 'found' && (
                    <button className={`toggle-btn ${showAll ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowAll(v => !v)}>
                        {showAll ? '📍 Cerca' : '👥 Todos'}
                    </button>
                )}
            </div>

            {loading ? (
                <p className="empty-state">⏳ Cargando...</p>
            ) : displayed.length === 0 ? (
                <p className="empty-state">
                    {query ? `Sin resultados para &quot;${query}&quot;`
                        : !showAll && geoStatus === 'found' ? `Sin clientes en ${NEARBY_RADIUS_KM} km — toca &quot;Todos&quot;`
                            : 'No hay clientes aún.'}
                </p>
            ) : (
                displayed.map(client => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        onEdit={() => setEditingClient(client)}
                        onDelete={() => handleDelete(client.id)}
                    />
                ))
            )}

            {editingClient && (
                <EditModal
                    client={editingClient}
                    providers={providers}
                    onClose={() => setEditingClient(null)}
                    onSaved={fetchAll}
                />
            )}
        </div>
    );
}
