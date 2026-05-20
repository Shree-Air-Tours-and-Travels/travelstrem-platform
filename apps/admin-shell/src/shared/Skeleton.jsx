import React from "react";

const styles = {
    tourCard: {
        background: 'var(--bg-2, #fff)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    pulse: {
        background: 'var(--border, #e0e0e0)',
        borderRadius: 6,
        animation: 'sk-pulse 1.4s ease-in-out infinite',
    },
};

function Pulse({ width = '100%', height = 16, style = {} }) {
    return <div style={{ ...styles.pulse, width, height, ...style }} />;
}

export function TourCardSkeleton() {
    return (
        <div style={styles.tourCard}>
            <Pulse height={160} style={{ marginBottom: 12 }} />
            <Pulse width="75%" height={20} style={{ marginBottom: 8 }} />
            <Pulse width="50%" height={14} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
                <Pulse width={60} height={28} />
                <Pulse width={60} height={28} />
            </div>
        </div>
    );
}

export function BookingCardSkeleton() {
    return (
        <div style={{ ...styles.tourCard, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Pulse width={48} height={48} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <Pulse width="60%" height={18} style={{ marginBottom: 6 }} />
                <Pulse width="40%" height={14} />
            </div>
            <Pulse width={80} height={28} />
        </div>
    );
}

export function WidgetError({ message, onRetry }) {
    return (
        <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted, #666)',
            background: 'var(--danger-soft, #fff0f0)',
            borderRadius: 8,
            border: '1px solid var(--danger-soft, #ffd0d0)',
        }}>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-danger, #e00)' }}>Something went wrong</h3>
            <p style={{ margin: '0 0 1rem', fontSize: 14 }}>{message}</p>
            {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
        </div>
    );
}
