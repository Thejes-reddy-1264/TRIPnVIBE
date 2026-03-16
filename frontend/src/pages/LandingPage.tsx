import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, MapPin, Navigation, Compass } from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '24px 0', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Compass size={28} color="var(--accent-solid)" />
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }} className="gradient-text">TRIPnVIBE</h1>
                    </div>
                    <nav style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/login')}>Log In</button>
                        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign Up</button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }} className="animate-fade-in">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '3.5rem', marginBottom: '24px', lineHeight: 1.1 }}>
                        Plan Your Next <span style={{ color: 'var(--accent-solid)' }}>Adventure</span> with AI
                    </h2>
                    <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                        Seamlessly design your perfect trip, optimize your route, and book tickets all in one place. Discover exactly where you want to go.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }} onClick={() => navigate('/login')}>
                            Start Planning
                        </button>
                    </div>
                </div>

                {/* Features area */}
                <div className="container" style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                    <div className="glass-card" style={{ textAlign: 'left', padding: '32px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <MapPin size={24} color="var(--accent-solid)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Smart Routing</h3>
                        <p className="text-muted">Generate highly optimized travel routes to save time and money as you move between destinations.</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'left', padding: '32px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Navigation size={24} color="var(--accent-solid)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>All-in-one Booking</h3>
                        <p className="text-muted">Find flights and hotels across the globe directly without ever leaving the application.</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'left', padding: '32px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Map size={24} color="var(--accent-solid)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Interactive Maps</h3>
                        <p className="text-muted">Visualize your entire journey on beautifully rendered interactive maps.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <p className="text-muted">© {new Date().getFullYear()} TRIPnVIBE. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
