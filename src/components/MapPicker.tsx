'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    Circle,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
const clientIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const userIcon = L.divIcon({
    className: '',
    html: `<div style="
        width: 18px; height: 18px;
        background: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const selectedIcon = L.divIcon({
    className: '',
    html: `<div style="
        width: 24px; height: 24px;
        background: #10B981;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 5px rgba(16,185,129,0.35);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

interface ClientMarker {
    id: string;
    name: string | null;
    lat: number;
    lng: number;
}

interface MapPickerProps {
    lat: number | null;
    lng: number | null;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    height?: string;
    clients?: ClientMarker[];
    showUserLocation?: boolean;
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'es', 'User-Agent': 'ClientesDB/1.0' } }
        );
        const data = await res.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// Click handler component
function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) { onSelect(e.latlng.lat, e.latlng.lng); },
    });
    return null;
}

// Map recenter component
function Recenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMapEvents({});
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
}

export default function MapPicker({
    lat,
    lng,
    onLocationSelect,
    height = '300px',
    clients = [],
    showUserLocation = false,
}: MapPickerProps) {
    const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
        lat && lng ? { lat, lng } : null
    );
    const [address, setAddress] = useState<string>('');
    const [loadingAddr, setLoadingAddr] = useState(false);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
    const addrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update selected when props change
    useEffect(() => {
        if (lat && lng) {
            setSelected({ lat, lng });
        }
    }, [lat, lng]);

    // Get user live location
    useEffect(() => {
        if (!showUserLocation || !navigator.geolocation) return;
        const watcher = navigator.geolocation.watchPosition(
            pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            undefined,
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watcher);
    }, [showUserLocation]);

    // Reverse geocode selected position (debounced)
    const handleSelect = (newLat: number, newLng: number) => {
        setSelected({ lat: newLat, lng: newLng });
        onLocationSelect(newLat, newLng); // Pass coords immediately

        if (addrTimerRef.current) clearTimeout(addrTimerRef.current);
        setAddress('');
        setLoadingAddr(true);
        addrTimerRef.current = setTimeout(async () => {
            const addr = await reverseGeocode(newLat, newLng);
            setAddress(addr);
            setLoadingAddr(false);
            onLocationSelect(newLat, newLng, addr); // Pass coords + address once resolved
        }, 400);
    };

    const defaultCenter: [number, number] = selected
        ? [selected.lat, selected.lng]
        : userPos
            ? [userPos.lat, userPos.lng]
            : [19.432608, -99.133209];

    return (
        <div>
            <div style={{ height, width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapContainer
                    center={defaultCenter}
                    zoom={selected ? 15 : 13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <ClickHandler onSelect={handleSelect} />

                    {/* User live location */}
                    {showUserLocation && userPos && (
                        <>
                            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                                <Popup>📍 Tu ubicación actual</Popup>
                            </Marker>
                            <Circle
                                center={[userPos.lat, userPos.lng]}
                                radius={100}
                                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 1 }}
                            />
                            <Recenter lat={userPos.lat} lng={userPos.lng} />
                        </>
                    )}

                    {/* Other clients markers */}
                    {clients.map(c => (
                        <Marker key={c.id} position={[c.lat, c.lng]} icon={clientIcon}>
                            <Popup>🏠 {c.name || `Cliente ${c.id.slice(0, 6)}`}</Popup>
                        </Marker>
                    ))}

                    {/* Selected / editing marker */}
                    {selected && (
                        <Marker position={[selected.lat, selected.lng]} icon={selectedIcon}>
                            <Popup>📌 Ubicación seleccionada</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Address display */}
            {selected && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#94A3B8', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', lineHeight: 1.4 }}>
                    {loadingAddr ? '🔍 Buscando dirección...' : address ? `📍 ${address}` : `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}`}
                </div>
            )}
        </div>
    );
}
