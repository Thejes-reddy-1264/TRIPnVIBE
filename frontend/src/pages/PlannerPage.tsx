import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Calendar, Check, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const getCoords = async (name: string) => {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&format=json`);
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
            return { lat: data.results[0].latitude, lng: data.results[0].longitude };
        }
    } catch (e) {
        console.error("Geocoding failed for", name, e);
    }
    // Fallback if not found or error
    return { lat: Math.random() * 180 - 90, lng: Math.random() * 360 - 180 };
};

const PlannerPage: React.FC = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [locations, setLocations] = useState([{ id: 1, name: '' }]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [optimizedRoutes, setOptimizedRoutes] = useState<any[] | null>(null);
    const [tripId, setTripId] = useState<number | null>(null);

    const addLocation = () => {
        setLocations([...locations, { id: locations.length + 1, name: '' }]);
    };

    const handleLocationChange = (id: number, value: string) => {
        setLocations(locations.map(loc => loc.id === id ? { ...loc, name: value } : loc));
    };

    const handleSetupTrip = async () => {
        if (!title || !startDate || !endDate || locations.some(loc => !loc.name)) {
            setError('Please fill in all fields and locations.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Create the Trip
            const tripRes = await apiClient.post('/trips/', {
                title,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString()
            });
            const newTripId = tripRes.data.id;
            setTripId(newTripId);

            // 2. Add locations to the trip sequentially
            for (const loc of locations) {
                const coords = await getCoords(loc.name);
                await apiClient.post(`/trips/${newTripId}/locations`, {
                    name: loc.name,
                    lat: coords.lat,
                    lng: coords.lng,
                    type: "general"
                });
            }

            // 3. Optimize the routes
            const optimizeRes = await apiClient.post(`/trips/${newTripId}/optimize`);
            setOptimizedRoutes(optimizeRes.data);
        } catch (err: any) {
            console.error('Trip generation failed:', err);
            setError(err.response?.data?.detail || 'Failed to generate trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToBookings = () => {
        if (tripId) {
            navigate(`/bookings/new?trip_id=${tripId}`);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '48px 0' }}>
            <div className="container animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 style={{ fontSize: '2rem' }}>Trip <span className="gradient-text">Planner</span></h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
                    {/* Main Formulation Area */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Navigation size={24} color="var(--accent-solid)" /> Define Your Route
                        </h3>

                        {error && (
                            <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Trip Title</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="E.g., Summer Eurotrip 2026"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Start Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="date"
                                        className="input-field"
                                        style={{ paddingLeft: '48px', colorScheme: 'dark' }}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">End Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="date"
                                        className="input-field"
                                        style={{ paddingLeft: '48px', colorScheme: 'dark' }}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 500 }}>Stops & Destinations</h4>
                                <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={addLocation}>+ Add Stop</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {locations.map((loc, idx) => (
                                    <div key={loc.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Search for a place (e.g., Paris, Tokyo)"
                                                style={{ paddingLeft: '48px' }}
                                                value={loc.name}
                                                onChange={(e) => handleLocationChange(loc.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!optimizedRoutes ? (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSetupTrip} disabled={loading}>
                                {loading ? 'Optimizing...' : <><Check size={20} /> Generate & Optimize Route</>}
                            </button>
                        ) : (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleProceedToBookings}>
                                Proceed to Bookings
                            </button>
                        )}
                    </div>

                    {/* Interactive Map Placeholder / Results (Side Panel) */}
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-glass)', minHeight: '500px' }}>
                        {optimizedRoutes ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', flex: '0 0 auto', borderBottom: '1px solid var(--border-color)' }}>
                                    <h4 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--accent-solid)' }}>Optimized Route</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                        {optimizedRoutes.map((route, idx) => (
                                            <div key={route.id} style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'var(--accent-solid)' }}>{idx + 1}.</span> {route.location?.name || 'Unknown Location'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1, position: 'relative', background: '#ccc' }}>
                                    {optimizedRoutes.length > 0 && (
                                        <MapContainer
                                            center={[optimizedRoutes[0].location.lat, optimizedRoutes[0].location.lng]}
                                            zoom={8}
                                            style={{ height: '100%', width: '100%' }}
                                            zoomControl={false}
                                        >
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
                                            {optimizedRoutes.map((route, idx) => route.location && (
                                                <Marker key={route.id} position={[route.location.lat, route.location.lng]}>
                                                    <Popup><div style={{ color: 'black' }}>{idx + 1}. {route.location.name}</div></Popup>
                                                </Marker>
                                            ))}
                                            <Polyline
                                                positions={optimizedRoutes.map(route => [route.location.lat, route.location.lng])}
                                                color="var(--accent-solid)"
                                                weight={4}
                                                dashArray="10, 10"
                                            />
                                        </MapContainer>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', padding: '24px' }}>
                                <Navigation size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5, display: 'inline-block' }} />
                                <p className="text-muted" style={{ fontSize: '0.95rem' }}>Add locations to visualize your highly-optimized route on the map.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlannerPage;
