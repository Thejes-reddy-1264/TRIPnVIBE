import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hotel, Plane, Check, AlertCircle, Loader2, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import apiClient from '../api/client';

interface Stop {
    id: number;
    stop_order: number;
    travel_time_mins: number;
    distance_km: number;
    location: { name: string; lat: number; lng: number };
}

interface BookingItem {
    stopId: number;
    stopName: string;
    type: 'hotel' | 'flight';
    provider: string;
    cost: number;
}

const BookingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('trip_id');

    const [stops, setStops] = useState<Stop[]>([]);
    const [loadingStops, setLoadingStops] = useState(true);
    const [confirmedBookings, setConfirmedBookings] = useState<BookingItem[]>([]);

    // Per-stop expanded state and options
    const [expandedStop, setExpandedStop] = useState<number | null>(null);
    const [activeType, setActiveType] = useState<{ [stopId: number]: 'hotel' | 'flight' }>({});
    const [options, setOptions] = useState<{ [stopId: number]: any[] }>({});
    const [loadingOptions, setLoadingOptions] = useState<{ [stopId: number]: boolean }>({});
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!tripId) return;
        apiClient.get(`/trips/${tripId}/routes`)
            .then(res => setStops(res.data))
            .catch(console.error)
            .finally(() => setLoadingStops(false));
    }, [tripId]);

    const fetchOptions = async (stop: Stop, type: 'hotel' | 'flight') => {
        setActiveType(prev => ({ ...prev, [stop.id]: type }));
        setLoadingOptions(prev => ({ ...prev, [stop.id]: true }));
        try {
            const response = await apiClient.get('/bookings/search', {
                params: {
                    type,
                    origin: stop.location?.name || 'Origin',
                    destination: stop.location?.name || 'Destination',
                    date: new Date().toISOString().split('T')[0]
                }
            });
            setOptions(prev => ({ ...prev, [stop.id]: response.data }));
        } catch {
            setOptions(prev => ({ ...prev, [stop.id]: [] }));
        } finally {
            setLoadingOptions(prev => ({ ...prev, [stop.id]: false }));
        }
    };

    const handleBook = async (stop: Stop, opt: any) => {
        if (!tripId) return;
        const type = activeType[stop.id] || 'hotel';
        const cost = opt.price || opt.cost || 2500;
        try {
            await apiClient.post('/bookings/', {
                trip_id: Number(tripId),
                type,
                provider_ref: opt.name || opt.hotelName || opt.airline || 'Provider',
                cost
            });
            const newBooking: BookingItem = {
                stopId: stop.id,
                stopName: stop.location?.name,
                type,
                provider: opt.name || opt.hotelName || opt.airline || 'Provider',
                cost
            };
            setConfirmedBookings(prev => [...prev, newBooking]);
            setStatusMsg(`✓ ${type === 'hotel' ? 'Hotel' : 'Flight'} booked at ${stop.location?.name}`);
            setTimeout(() => setStatusMsg(null), 3000);
        } catch {
            alert('Failed to save booking. Please try again.');
        }
    };

    const totalCost = confirmedBookings.reduce((s, b) => s + b.cost, 0);

    if (loadingStops) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span>Loading trip stops...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '32px 0' }}>
            <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Book Your Stays & Flights</h1>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '2px' }}>Book hotels and flights for each stop on your trip</p>
                    </div>
                </div>

                {/* Status toast */}
                {statusMsg && (
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Check size={16} /> {statusMsg}
                    </div>
                )}

                {/* Per-Stop Booking Cards */}
                {stops.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
                        <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                        <p className="text-muted">No stops found for this trip. Please go back and plan your trip first.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {stops.map((stop, idx) => {
                            const isOpen = expandedStop === stop.id;
                            const stopOptions = options[stop.id] || [];
                            const isLoading = loadingOptions[stop.id];
                            const type = activeType[stop.id];
                            const bookedHere = confirmedBookings.filter(b => b.stopId === stop.id);

                            return (
                                <div key={stop.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                    {/* Stop Header — click to expand */}
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border-color)' : 'none' }}
                                        onClick={() => setExpandedStop(isOpen ? null : stop.id)}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-solid)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{idx + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{stop.location?.name || `Stop ${idx + 1}`}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {stop.travel_time_mins > 0 ? `~${stop.travel_time_mins} min from previous stop` : 'Starting point'}
                                                {bookedHere.length > 0 && <span style={{ marginLeft: '8px', color: '#16a34a', fontWeight: 500 }}>· {bookedHere.length} booked</span>}
                                            </div>
                                        </div>
                                        {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                                    </div>

                                    {/* Expanded Booking Panel */}
                                    {isOpen && (
                                        <div style={{ padding: '20px' }}>
                                            {/* Type Selector */}
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                                <button
                                                    onClick={() => fetchOptions(stop, 'hotel')}
                                                    className="btn"
                                                    style={{ flex: 1, background: type === 'hotel' ? 'var(--accent-solid)' : 'var(--bg-secondary)', color: type === 'hotel' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                                >
                                                    <Hotel size={16} /> Hotels at {stop.location?.name?.split(',')[0]}
                                                </button>
                                                <button
                                                    onClick={() => fetchOptions(stop, 'flight')}
                                                    className="btn"
                                                    style={{ flex: 1, background: type === 'flight' ? 'var(--accent-solid)' : 'var(--bg-secondary)', color: type === 'flight' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                                >
                                                    <Plane size={16} /> Flights to {stop.location?.name?.split(',')[0]}
                                                </button>
                                            </div>

                                            {/* Options */}
                                            {isLoading ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '16px 0' }}>
                                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Searching...
                                                </div>
                                            ) : stopOptions.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {stopOptions.map((opt: any, i: number) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                            <div>
                                                                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{opt.name || opt.hotelName || opt.airline || 'Option'}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.description || opt.address || opt.flightNumber || `${type === 'hotel' ? 'Standard room' : 'Economy class'}`}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                                <span style={{ fontWeight: 600, color: 'var(--accent-solid)', fontSize: '1rem' }}>₹{opt.price || opt.cost || '—'}</span>
                                                                <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => handleBook(stop, opt)}>
                                                                    Book
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : type ? (
                                                <p className="text-muted" style={{ fontSize: '0.9rem' }}>No results found. Try a different option.</p>
                                            ) : (
                                                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Select Hotels or Flights above to see available options for this stop.</p>
                                            )}

                                            {/* Already booked here */}
                                            {bookedHere.length > 0 && (
                                                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Booked for this stop:</div>
                                                    {bookedHere.map((b, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Check size={12} color="#16a34a" /> {b.type === 'hotel' ? '🏨' : '✈️'} {b.provider}
                                                            </span>
                                                            <span style={{ color: 'var(--accent-solid)', fontWeight: 500 }}>₹{b.cost}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary & Checkout */}
                {confirmedBookings.length > 0 && (
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{confirmedBookings.length} booking{confirmedBookings.length > 1 ? 's' : ''} added</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total: <strong style={{ color: 'var(--accent-solid)' }}>₹{totalCost.toLocaleString()}</strong></div>
                        </div>
                        <button className="btn btn-primary" onClick={() => navigate(`/payment?amount=${totalCost}`)}>
                            <CreditCard size={16} /> Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
