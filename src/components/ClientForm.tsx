'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ClientForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [geoStatus, setGeoStatus] = useState('');
    const [showMap, setShowMap] = useState(true); // Show map by default

    const [formData, setFormData] = useState({
        name: '',
        hikvision_user: '', hikvision_pass: '',
        google_email: '', google_pass: '',
        ewelink_user: '', ewelink_pass: '',
        domotics_notes: '',
        latitude: '', longitude: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handleMapLocation = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
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
                    name: '', hikvision_user: '', hikvision_pass: '',
                    google_email: '', google_pass: '', ewelink_user: '',
                    ewelink_pass: '', domotics_notes: '', latitude: '', longitude: ''
                });
                setGeoStatus('');
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="client-form">
            <div className="form-group full-width">
                <label>Nombre / Proyecto <span className="optional-tag">opcional</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Casa García, Oficina 3B..." />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Hikvision Usuario</label>
                    <input type="text" name="hikvision_user" value={formData.hikvision_user} onChange={handleChange} placeholder="admin" />
                </div>
                <div className="form-group">
                    <label>Hikvision Contraseña</label>
                    <input type="text" name="hikvision_pass" value={formData.hikvision_pass} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Google Correo</label>
                    <input type="email" name="google_email" value={formData.google_email} onChange={handleChange} placeholder="correo@gmail.com" />
                </div>
                <div className="form-group">
                    <label>Google Contraseña</label>
                    <input type="text" name="google_pass" value={formData.google_pass} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>eWeLink Usuario</label>
                    <input type="text" name="ewelink_user" value={formData.ewelink_user} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>eWeLink Contraseña</label>
                    <input type="text" name="ewelink_pass" value={formData.ewelink_pass} onChange={handleChange} />
                </div>
            </div>

            <div className="form-group full-width">
                <label>Notas Extra Domótica</label>
                <textarea name="domotics_notes" value={formData.domotics_notes} onChange={handleChange} rows={2} placeholder="Contraseñas WiFi, notas adicionales..."></textarea>
            </div>

            <div className="location-section full-width card-inner">
                <div className="location-header">
                    <h3>📍 Geolocalización</h3>
                    <div className="location-actions">
                        <button type="button" onClick={obtainAutoLocation} className="button-primary btn-sm">
                            Auto Detectar
                        </button>
                        <button type="button" onClick={() => setShowMap(!showMap)} className="button-secondary btn-sm">
                            {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                        </button>
                    </div>
                </div>

                {geoStatus && <p className="status-message">{geoStatus}</p>}

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
                    <div className="map-container-wrapper">
                        <MapPicker
                            lat={formData.latitude ? parseFloat(formData.latitude) : null}
                            lng={formData.longitude ? parseFloat(formData.longitude) : null}
                            onLocationSelect={handleMapLocation}
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
