'use client';

import { useState, useEffect, useCallback } from 'react';

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
    distance?: number; // km
}

// --- Haversine distance formula ---
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Card component ---
function ClientCard({ client }: { client: ClientWithDistance }) {
    const [open, setOpen] = useState(false);

    const title = client.name ||
        (client.accounts.length > 0 ? client.accounts[0].username : null) ||
        `Cliente ${client.id.slice(0, 6)}`;

    const date = new Date(client.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const hasLocation = client.latitude && client.longitude;
    const distanceLabel = client.distance !== undefined
        ? client.distance < 1
            ? `${Math.round(client.distance * 1000)} m`
            : `${client.distance.toFixed(1)} km`
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
                    {distanceLabel && (
                        <span className="distance-badge">📍 {distanceLabel}</span>
                    )}
                    {hasLocation && !distanceLabel && <span className="location-badge">📍</span>}
                    <span className={`chevron ${open ? 'up' : ''}`}>›</span>
                </div>
            </button>

            {open && (
                <div className="client-details">
                    {client.accounts.map(acc => (
                        <div key={acc.id} className="detail-group" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #334155' }}>
                            <span className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#3B82F6' }}>
                                🏷️ {acc.provider.name}
                            </span>
                            <span className="value" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                {acc.username || '-'} / <code>{acc.password || '-'}</code>
                            </span>
                            {acc.notes && <span className="value" style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>{acc.notes}</span>}
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
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${client.latitude}&mlon=${client.longitude}#map=18/${client.latitude}/${client.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link button-secondary btn-sm"
                            >
                                Ver en Mapa 🗺️
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Main component ---
export default function ClientList() {
    const [allClients, setAllClients] = useState<ClientWithDistance[]>([]);
    const [loading, setLoading] = useState(true);
    const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'found' | 'denied'>('idle');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const NEARBY_RADIUS_KM = 5;

    // Fetch clients
    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data: Client[] = await res.json();
                setAllClients(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Ask geolocation on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoStatus('denied');
            setShowAll(true);
            return;
        }
        setGeoStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoStatus('found');
            },
            () => {
                setGeoStatus('denied');
                setShowAll(true);
            },
            { timeout: 10000 }
        );
    }, []);

    // Augment clients with distance, sorted by proximity
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

    // Filter: nearby or all
    const locationFiltered = showAll || !userLocation
        ? clientsWithDistance
        : clientsWithDistance.filter(c => c.distance === undefined || c.distance <= NEARBY_RADIUS_KM);

    // Filter: search query (name or notes)
    const query = searchQuery.toLowerCase().trim();
    const displayed = query
        ? locationFiltered.filter(c =>
            (c.name?.toLowerCase().includes(query)) ||
            (c.domotics_notes?.toLowerCase().includes(query))
        )
        : locationFiltered;

    const nearbyCount = userLocation
        ? clientsWithDistance.filter(c => c.distance !== undefined && c.distance <= NEARBY_RADIUS_KM).length
        : 0;

    return (
        <div className="clients-list-wrapper">
            {/* Geo status bar */}
            {geoStatus === 'locating' && (
                <div className="geo-banner geo-locating">
                    📡 Obteniendo tu ubicación...
                </div>
            )}
            {geoStatus === 'found' && !showAll && (
                <div className="geo-banner geo-found">
                    📍 Mostrando {nearbyCount} clientes cerca de ti (radio {NEARBY_RADIUS_KM} km)
                </div>
            )}
            {geoStatus === 'denied' && (
                <div className="geo-banner geo-denied">
                    ⚠️ Sin acceso a ubicación — mostrando todos los clientes
                </div>
            )}

            {/* Search + Toggle bar */}
            <div className="list-controls">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Buscar por nombre..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {geoStatus === 'found' && (
                    <button
                        className={`toggle-btn ${showAll ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setShowAll(v => !v)}
                    >
                        {showAll ? '📍 Cerca de mí' : '👥 Ver todos'}
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <p className="empty-state">⏳ Cargando clientes...</p>
            ) : displayed.length === 0 ? (
                <p className="empty-state">
                    {query
                        ? `Sin resultados para "${query}"`
                        : !showAll && geoStatus === 'found'
                            ? `No hay clientes en un radio de ${NEARBY_RADIUS_KM} km — prueba "Ver todos"`
                            : 'No hay clientes registrados aún.'}
                </p>
            ) : (
                displayed.map(client => (
                    <ClientCard key={client.id} client={client} />
                ))
            )}
        </div>
    );
}
