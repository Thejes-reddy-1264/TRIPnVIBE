import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Check, AlertCircle, Trash2, Plus } from 'lucide-react';
import apiClient from '../api/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const getCoords = async (name: string) => {
    const response = await apiClient.get('/places/geocode', { params: { name } });
    return { lat: response.data.lat, lng: response.data.lng };
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
        setLocations([...locations, { id: Date.now(), name: '' }]);
    };

    const removeLocation = (id: number) => {
        if (locations.length > 1) setLocations(locations.filter(l => l.id !== id));
    };

    const handleLocationChange = (id: number, value: string) => {
        setLocations(locations.map(loc => loc.id === id ? { ...loc, name: value } : loc));
    };

    const handleSetupTrip = async () => {
        if (!title || !startDate || !endDate || locations.some(l => !l.name.trim())) {
            setError('Please fill in all fields and location names.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const tripRes = await apiClient.post('/trips/', {
                title,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString()
            });
            const newTripId = tripRes.data.id;
            setTripId(newTripId);

            for (const loc of locations) {
                const coords = await getCoords(loc.name);
                await apiClient.post(`/trips/${newTripId}/locations`, {
                    name: loc.name,
                    lat: coords.lat,
                    lng: coords.lng,
                    type: 'general'
                });
            }

            const optimizeRes = await apiClient.post(`/trips/${newTripId}/optimize`);
            setOptimizedRoutes(optimizeRes.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const mapPositions = optimizedRoutes
        ? optimizedRoutes.filter(r => r.location).map(r => [r.location.lat, r.location.lng] as [number, number])
        : [];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '32px 0' }}>
            <div className="container animate-fade-in" style={{ maxWidth: '900px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Trip Planner</h1>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '2px' }}>Plan your route and get an optimized itinerary</p>
                    </div>
                </div>

                {/* Planning Form — hidden after optimization */}
                {!optimizedRoutes && (
                    <div className="glass-card" style={{ marginBottom: '24px' }}>
                        {error && (
                            <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Trip Name</label>
                            <input type="text" className="input-field" placeholder="E.g., South India Road Trip" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Start Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="date" className="input-field" style={{ paddingLeft: '40px', colorScheme: 'light' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">End Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="date" className="input-field" style={{ paddingLeft: '40px', colorScheme: 'light' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>Destinations / Stops</label>
                                <button className="btn btn-secondary" style={{ padding: '5px 14px', fontSize: '0.85rem' }} onClick={addLocation}>
                                    <Plus size={14} /> Add Stop
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {locations.map((loc, idx) => (
                                    <div key={loc.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-solid)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>{idx + 1}</span>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input type="text" className="input-field" placeholder="Enter city or place name" style={{ paddingLeft: '40px' }} value={loc.name} onChange={e => handleLocationChange(loc.id, e.target.value)} />
                                        </div>
                                        {locations.length > 1 && (
                                            <button onClick={() => removeLocation(loc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSetupTrip} disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                    Geocoding & Optimizing Route...
                                </span>
                            ) : <><Check size={18} /> Generate Optimized Route</>}
                        </button>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Optimized Result */}
                {optimizedRoutes && (
                    <div>
                        {/* Success Banner */}
                        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Check size={20} color="#16a34a" />
                            <div>
                                <div style={{ fontWeight: 600, color: '#15803d' }}>Route Optimized!</div>
                                <div style={{ fontSize: '0.85rem', color: '#166534' }}>Your stops have been arranged for the most efficient travel order.</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', marginBottom: '24px' }}>
                            {/* Stop List */}
                            <div className="glass-card">
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Your Itinerary</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {optimizedRoutes.map((route, idx) => (
                                        <div key={route.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
                                            {/* Timeline line */}
                                            {idx < optimizedRoutes.length - 1 && (
                                                <div style={{ position: 'absolute', left: '11px', top: '28px', width: '2px', bottom: '0', background: '#e2e8f0' }} />
                                            )}
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-solid)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, zIndex: 1, flexShrink: 0 }}>{idx + 1}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{route.location?.name || 'Unknown'}</div>
                                                {route.travel_time_mins > 0 && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        ~{route.travel_time_mins} min drive · {route.distance_km} km
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Map */}
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', minHeight: '320px' }}>
                                {mapPositions.length > 0 && (
                                    <MapContainer center={mapPositions[0]} zoom={6} style={{ height: '100%', width: '100%', minHeight: '320px' }}>
                                        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                                        {optimizedRoutes.filter(r => r.location).map((route, idx) => (
                                            <Marker key={route.id} position={[route.location.lat, route.location.lng]}>
                                                <Popup><div style={{ fontWeight: 500 }}>Stop {idx + 1}: {route.location.name}</div></Popup>
                                            </Marker>
                                        ))}
                                        {mapPositions.length > 1 && <Polyline positions={mapPositions} color="var(--accent-solid)" weight={3} dashArray="8,8" />}
                                    </MapContainer>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
                                Save & Go to Dashboard
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/bookings/new?trip_id=${tripId}`)}>
                                Book Hotels & Flights →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlannerPage;
