import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const amount = searchParams.get('amount') || '14500';
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '48px', maxWidth: '500px' }}>
                    <div style={{ background: 'rgba(46, 213, 115, 0.2)', color: '#2ed573', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }} className="gradient-text">Payment Successful!</h2>
                    <p className="text-muted" style={{ marginBottom: '32px' }}>Your trip and bookings have been confirmed and saved.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '48px 0' }}>
            <div className="container animate-fade-in" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 style={{ fontSize: '2rem' }}>Secure <span className="gradient-text">Checkout</span></h1>
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--text-muted)' }}>
                        <ShieldCheck size={24} color="var(--accent-solid)" />
                        <span style={{ fontSize: '0.9rem' }}>256-bit SSL Encrypted Payment</span>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Cardholder Name</label>
                        <input type="text" className="input-field" placeholder="John Doe" />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Card Number</label>
                        <div style={{ position: 'relative' }}>
                            <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="text" className="input-field" placeholder="XXXX XXXX XXXX XXXX" style={{ paddingLeft: '48px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Expiry Date</label>
                            <input type="text" className="input-field" placeholder="MM/YY" />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">CVV</label>
                            <input type="password" className="input-field" placeholder="•••" maxLength={4} />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                        onClick={handlePayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing Payment...' : `Pay ₹ ${amount}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
