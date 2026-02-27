import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, LogOut, Compass, Trash2 } from 'lucide-react';
import apiClient from '../api/client';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await apiClient.get('/trips/');
                setTrips(response.data);
            } catch (err) {
                console.error("Failed to fetch trips", err);
                // If unauthorized, redirect to login
                if ((err as any).response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDeleteTrip = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this trip?")) {
            try {
                await apiClient.delete(`/trips/${id}`);
                setTrips(trips.filter(t => t.id !== id));
            } catch (err) {
                console.error("Failed to delete trip", err);
                alert("Could not delete trip. Please try again.");
            }
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar Navigation */}
            <aside style={{ width: '280px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
                    <Compass size={28} color="var(--accent-solid)" />
                    <h2 style={{ fontSize: '1.4rem' }} className="gradient-text">TRIPnVIBE</h2>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <Map size={20} /> <span style={{ fontWeight: 500 }}>Dashboard</span>
                    </div>
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', marginTop: 'auto' }} onClick={handleLogout}>
                    <LogOut size={20} /> <span>Sign Out</span>
                </div>
            </aside>

            {/* Main Content */}
            <main className="container animate-fade-in" style={{ flex: 1, padding: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Welcome back, <span className="gradient-text">Traveler</span></h1>
                        <p className="text-muted">Where are we heading next?</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/planner')}>
                        <Plus size={20} /> Plan a New Trip
                    </button>
                </div>

                <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 500 }}>Your Upcoming Trips</h3>

                {isLoading ? (
                    <div className="text-muted">Loading your trips...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {trips.length === 0 ? (
                            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px', borderStyle: 'dashed', background: 'transparent' }}>
                                <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                                    <Compass size={32} color="var(--text-muted)" />
                                </div>
                                <h4 style={{ marginBottom: '8px' }}>No upcoming trips</h4>
                                <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>It's time to start planning your next adventure.</p>
                                <button className="btn btn-secondary" onClick={() => navigate('/planner')}>Explore Destinations</button>
                            </div>
                        ) : (
                            trips.map(trip => (
                                <div key={trip.id} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/trip/${trip.id}`)}>
                                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{trip.title}</h4>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                                        {trip.start_date} to {trip.end_date}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ padding: '4px 12px', background: 'rgba(255,51,102,0.1)', color: 'var(--accent-solid)', borderRadius: '12px', fontSize: '0.8rem' }}>
                                            {trip.status}
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            title="Delete Trip"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
