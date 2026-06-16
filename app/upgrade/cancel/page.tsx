import Link from 'next/link';

export default function UpgradeCancel() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 56px', maxWidth: 440,
        width: '90%', textAlign: 'center', boxShadow: '0 8px 48px rgba(0,0,0,.10)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>
          No charge was made
        </h1>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, margin: '0 0 32px' }}>
          You cancelled the upgrade — your card was not charged. You can upgrade any time
          from the sidebar when you&apos;re ready.
        </p>
        <Link href="/" style={{
          display: 'inline-block', background: '#111', color: '#fff',
          borderRadius: 10, padding: '12px 28px', fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          Back to my presentations
        </Link>
      </div>
    </div>
  );
}
