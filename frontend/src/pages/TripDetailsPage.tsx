import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Calendar, Navigation } from 'lucide-react';
import apiClient from '../api/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TripDetailsPage: React.FC = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tripRes, routeRes, bookingRes] = await Promise.all([
                    apiClient.get('/trips/'), // Get all and filter locally for simplicity
                    apiClient.get(`/trips/${tripId}/routes`),
                    apiClient.get(`/bookings/trip/${tripId}`)
                ]);
                const currentTrip = tripRes.data.find((t: any) => t.id === Number(tripId));
                setTrip(currentTrip);
                setRoutes(routeRes.data);
                setBookings(bookingRes.data);
            } catch (err) {
                console.error('Failed to load trip details', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tripId]);

    const positions: [number, number][] = routes
        .filter(r => r.location && r.location.lat !== 0)
        .map(r => [r.location.lat, r.location.lng]);

    return (
        <div style={{ minHeight: '100vh', padding: '48px 0' }}>
            <div className="container animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                    <h1 style={{ fontSize: '2rem' }}>Trip <span className="gradient-text">Details</span></h1>
                </div>

                {loading ? (
                    <div className="text-muted">Loading trip details...</div>
                ) : !trip ? (
                    <div className="text-muted">Trip not found.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
                        {/* Map Area */}
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{trip.title}</h2>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {new Date(trip.start_date || '').toLocaleDateString()} - {new Date(trip.end_date || '').toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1, position: 'relative', background: '#e0e0e0', zIndex: 0 }}>
                                {positions.length > 0 ? (
                                    <MapContainer center={positions[0]} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors" />
                                        {routes.map((route, idx) => route.location && (
                                            <Marker key={route.id} position={[route.location.lat, route.location.lng]}>
                                                <Popup >
                                                    <div style={{ color: 'black' }}>Stop {idx + 1}: {route.location.name}</div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                        {positions.length > 1 && <Polyline positions={positions} color="var(--accent-solid)" weight={4} dashArray="10, 10" />}
                                    </MapContainer>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        <Map size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                        <p>Map generated successfully but specific coordinates were not saved.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Itinerary Area */}
                        <div className="glass-card" style={{ padding: '32px' }}>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Navigation size={24} color="var(--accent-solid)" /> Itinerary Stops
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {routes.map((route, idx) => (
                                    <div key={route.id} style={{ borderLeft: '3px solid var(--accent-solid)', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-solid)' }}></div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Stop {idx + 1}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{route.location?.name}</div>
                                        {route.travel_time_mins > 0 && idx > 0 && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--accent-solid)', marginTop: '4px' }}>
                                                ~ {route.travel_time_mins} mins travel
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {routes.length === 0 && <p className="text-muted">No stops on this route.</p>}
                            </div>

                            <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', marginTop: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Navigation size={24} color="var(--accent-solid)" /> Confirmed Bookings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {bookings.map((booking) => (
                                    <div key={booking.id} style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent-solid)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                                {booking.type}
                                            </div>
                                            <div style={{ color: 'var(--accent-solid)', fontWeight: 600 }}>₹{booking.cost}</div>
                                        </div>
                                        <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                            Provider: {booking.provider_ref}
                                        </div>
                                    </div>
                                ))}
                                {bookings.length === 0 && <p className="text-muted">No active bookings found.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripDetailsPage;
