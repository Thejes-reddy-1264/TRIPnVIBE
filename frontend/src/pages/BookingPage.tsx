import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Home, Plane, Car, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

const BookingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('trip_id');

    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'cab' | null>(null);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [tripData, setTripData] = useState<any>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (tripId) {
            // Fetch routes to get locations and dates for search context
            apiClient.get(`/trips/${tripId}/routes`).then(res => {
                setRoutes(res.data);
            }).catch(console.error);
        }
    }, [tripId]);

    const handleSearch = async (type: 'hotel' | 'flight' | 'cab') => {
        setActiveTab(type);
        setLoading(true);
        setError(null);
        setOptions([]);

        try {
            // Determine search parameters based on the first few stops of the trip
            let origin = 'New York';
            let destination = 'London';
            let date = new Date().toISOString().split('T')[0];

            if (routes.length >= 2) {
                origin = routes[0].location?.name || origin;
                destination = routes[1].location?.name || destination;
            } else if (routes.length === 1) {
                destination = routes[0].location?.name || destination;
            }

            const response = await apiClient.get('/bookings/search', {
                params: {
                    type,
                    origin,
                    destination,
                    date
                }
            });
            setOptions(response.data);
        } catch (err: any) {
            console.error('Failed to fetch bookings:', err);
            setError(err.response?.data?.detail || 'Failed to search booking options.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = async (opt: any) => {
        if (!tripId) return;
        try {
            const cost = opt.price || Math.floor(Math.random() * 5000) + 500;
            await apiClient.post('/bookings/', {
                trip_id: Number(tripId),
                type: activeTab || 'unknown',
                provider_ref: opt.name || opt.hotelName || opt.airline || 'Standard Provider',
                cost: cost
            });
            setTotalAmount(prev => prev + cost);
            alert('Successfully added to your itinerary!');
        } catch (err) {
            console.error('Failed to book', err);
            alert('Failed to save booking. Please try again.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '48px 0' }}>
            <div className="container animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => navigate('/planner')}>
                        <ArrowLeft size={20} /> Back to Planner
                    </button>
                    <h1 style={{ fontSize: '2rem' }}>Configure <span className="gradient-text">Bookings</span></h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '48px' }}>
                    {/* Booking Option Cards */}
                    <div
                        className={`glass-card ${activeTab === 'hotel' ? 'active-border' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: activeTab === 'hotel' ? '2px solid var(--accent-solid)' : '1px solid var(--border-color)' }}
                        onClick={() => handleSearch('hotel')}
                    >
                        <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: '50%', marginBottom: '16px', color: 'var(--accent-solid)' }}>
                            <Home size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Hotels</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Secure premium stays at your optimized destinations.</p>
                    </div>

                    <div
                        className={`glass-card ${activeTab === 'flight' ? 'active-border' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: activeTab === 'flight' ? '2px solid var(--accent-solid)' : '1px solid var(--border-color)' }}
                        onClick={() => handleSearch('flight')}
                    >
                        <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: '50%', marginBottom: '16px', color: 'var(--accent-solid)' }}>
                            <Plane size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Flights</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Find the fastest inter-city transit routes.</p>
                    </div>

                    <div
                        className={`glass-card ${activeTab === 'cab' ? 'active-border' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: activeTab === 'cab' ? '2px solid var(--accent-solid)' : '1px solid var(--border-color)' }}
                        onClick={() => handleSearch('cab')}
                    >
                        <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: '50%', marginBottom: '16px', color: 'var(--accent-solid)' }}>
                            <Car size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Local Cabs</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Schedule point-to-point city transportation.</p>
                    </div>
                </div>

                {/* Detailed Search List Placeholder */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', textTransform: 'capitalize' }}>
                        Available {activeTab ? activeTab + 's' : 'Options'}
                    </h3>

                    {error && (
                        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {!activeTab ? (
                        <p className="text-muted" style={{ marginBottom: '24px' }}>Select a booking category above to explore availability.</p>
                    ) : (
                        <p className="text-muted" style={{ marginBottom: '24px' }}>Showing top results for your trip destinations.</p>
                    )}

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '48px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--accent-solid)' }}>
                                <Loader2 size={32} className="animate-spin" />
                                <span style={{ color: 'var(--text-primary)' }}>Searching External Providers...</span>
                            </div>
                        ) : options.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                                {options.map((opt, idx) => (
                                    <div key={idx} style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.name || opt.hotelName || opt.airline || 'Provider Option'}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{opt.description || opt.address || opt.flightNumber || 'Standard class booking.'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-solid)' }}>
                                                ₹{opt.price || Math.floor(Math.random() * 5000) + 500}
                                            </div>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 12px', fontSize: '0.8rem', marginTop: '8px' }}
                                                onClick={() => handleSelectOption(opt)}
                                            >
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No options loaded. Select a provider above.</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                        <button className="btn btn-primary" onClick={() => navigate(`/payment?amount=${totalAmount || 14500}`)}>
                            <CreditCard size={20} /> Checkout & Save Trip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
