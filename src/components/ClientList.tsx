'use client';

import { useState } from 'react';

interface Client {
    id: string;
    name: string | null;
    hikvision_user: string | null;
    hikvision_pass: string | null;
    google_email: string | null;
    google_pass: string | null;
    ewelink_user: string | null;
    ewelink_pass: string | null;
    domotics_notes: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
}

function ClientCard({ client }: { client: Client }) {
    const [open, setOpen] = useState(false);

    const title = client.name ||
        client.hikvision_user ||
        client.google_email ||
        client.ewelink_user ||
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
                    {client.hikvision_user && (
                        <div className="detail-group">
                            <span className="label">🎥 Hikvision</span>
                            <span className="value">{client.hikvision_user} / <code>{client.hikvision_pass}</code></span>
                        </div>
                    )}
                    {client.google_email && (
                        <div className="detail-group">
                            <span className="label">🔵 Google</span>
                            <span className="value">{client.google_email} / <code>{client.google_pass}</code></span>
                        </div>
                    )}
                    {client.ewelink_user && (
                        <div className="detail-group">
                            <span className="label">⚡ eWeLink</span>
                            <span className="value">{client.ewelink_user} / <code>{client.ewelink_pass}</code></span>
                        </div>
                    )}
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
