'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import MapPicker dynamically so it only loads on the client side (Leaflet requires window)
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ClientForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [geoStatus, setGeoStatus] = useState('');
    const [showMap, setShowMap] = useState(false);

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
            setGeoStatus('Geolocalización no soportada en tu navegador.');
            return;
        }
        setGeoStatus('Obteniendo ubicación...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
                setGeoStatus('¡Ubicación detectada!');
            },
            (error) => {
                console.error(error);
                setGeoStatus('Error obteniendo ubicación. Usa el mapa manual.');
                setShowMap(true); // Automatically show map if auto fails
            }
        );
    };

    const handleMapLocation = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
        setGeoStatus('Ubicación seleccionada en mapa.');
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
                setGeoStatus('Cliente guardado con éxito.');
                setShowMap(false);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setGeoStatus('Error al guardar cliente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="client-form">
            <div className="form-group full-width">
                <label>Nombre del Cliente o Proyecto *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Hikvision Usuario</label>
                    <input type="text" name="hikvision_user" value={formData.hikvision_user} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Hikvision Contraseña</label>
                    <input type="text" name="hikvision_pass" value={formData.hikvision_pass} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Google Correo</label>
                    <input type="email" name="google_email" value={formData.google_email} onChange={handleChange} />
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
                <textarea name="domotics_notes" value={formData.domotics_notes} onChange={handleChange} rows={3}></textarea>
            </div>

            <div className="location-section full-width card-inner">
                <h3>Geolocalización</h3>

                <div className="location-actions">
                    <button type="button" onClick={obtainAutoLocation} className="button-primary">
                        📍 Auto Detectar Ubicación
                    </button>
                    <button type="button" onClick={() => setShowMap(!showMap)} className="button-secondary">
                        🗺️ Usar Mapa Manual
                    </button>
                </div>

                {geoStatus && <p className="status-message">{geoStatus}</p>}

                <div className="form-row coords-preview">
                    <div className="form-group">
                        <label>Latitud</label>
                        <input type="text" name="latitude" readOnly value={formData.latitude} />
                    </div>
                    <div className="form-group">
                        <label>Longitud</label>
                        <input type="text" name="longitude" readOnly value={formData.longitude} />
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
                {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
        </form>
    );
}
