'use client';

import { useState } from 'react';

interface Client {
    id: string;
    name: string | null;
    domotics_notes: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    accounts: {
        id: string;
        username: string | null;
        password: string | null;
        notes: string | null;
        provider: {
            id: string;
            name: string;
        }
    }[];
}

function ClientCard({ client }: { client: Client }) {
    const [open, setOpen] = useState(false);

    const title = client.name ||
        (client.accounts.length > 0 ? client.accounts[0].username : null) ||
        `Cliente ${client.id.slice(0, 6)}`;

    const date = new Date(client.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const hasLocation = client.latitude && client.longitude;

    return (
        <div className={`client-item ${open ? 'open' : ''}`}>
            <button type="button" className="client-header" onClick={() => setOpen(!open)}>
                <div className="client-title-row">
                    <span className="client-icon">🏠</span>
                    <span className="client-name">{title}</span>
                </div>
                <div className="client-meta">
                    <span className="client-date">{date}</span>
                    {hasLocation && <span className="location-badge">📍</span>}
                    <span className={`chevron ${open ? 'up' : ''}`}>›</span>
                </div>
            </button>

            {open && (
                <div className="client-details">
                    {client.accounts.map(acc => (
                        <div key={acc.id} className="detail-group" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #ced4da' }}>
                            <span className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#1c7ed6' }}>
                                🏷️ {acc.provider.name}
                            </span>
                            <span className="value" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                {acc.username || '-'} / <code>{acc.password || '-'}</code>
                            </span>
                            {acc.notes && <span className="value" style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>{acc.notes}</span>}
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
                                Ver en Mapa
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ClientList({ clients }: { clients: Client[] }) {
    return (
        <div className="clients-list">
            {clients.length === 0 ? (
                <p className="empty-state">No hay clientes registrados aún.</p>
            ) : (
                clients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                ))
            )}
        </div>
    );
}
