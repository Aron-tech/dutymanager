import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface ErrorProps {
    status: number;
    message?: string;
    fallbackUrl?: string;
}

const ERROR_CONFIG: Record<number, {
    title: string;
    subtitle: string;
    description: string;
    glowColor: string;
    accentColor: string;
}> = {
    403: {
        title: '403',
        subtitle: 'Hozzáférés megtagadva',
        description: 'Nincs jogosultságod megtekinteni ezt az oldalt. Ha úgy gondolod, hogy ez hiba, fordulj a szerver adminisztrátorához.',
        glowColor: 'rgba(239,68,68,0.15)',
        accentColor: '#ef4444',
    },
    404: {
        title: '404',
        subtitle: 'Az oldal nem található',
        description: 'A keresett oldal nem létezik, vagy áthelyezték. Ellenőrizd a címet, vagy lépj vissza.',
        glowColor: 'rgba(251,191,36,0.12)',
        accentColor: '#f59e0b',
    },
    419: {
        title: '419',
        subtitle: 'Munkamenet lejárt',
        description: 'Az oldal munkamenete lejárt. Frissítsd az oldalt és próbáld újra.',
        glowColor: 'rgba(99,102,241,0.15)',
        accentColor: '#6366f1',
    },
    429: {
        title: '429',
        subtitle: 'Túl sok kérés',
        description: 'Rövid idő alatt túl sok kérést küldtél. Várj egy percet, majd próbáld újra.',
        glowColor: 'rgba(249,115,22,0.15)',
        accentColor: '#f97316',
    },
    500: {
        title: '500',
        subtitle: 'Szerverhiba',
        description: 'A szerveren belső hiba keletkezett. A csapatunk értesült a problémáról, hamarosan megoldjuk.',
        glowColor: 'rgba(239,68,68,0.15)',
        accentColor: '#ef4444',
    },
    503: {
        title: '503',
        subtitle: 'A szolgáltatás nem elérhető',
        description: 'Az oldal jelenleg karbantartás alatt áll. Hamarosan visszatér a teljes szolgáltatás.',
        glowColor: 'rgba(20,184,166,0.15)',
        accentColor: '#14b8a6',
    },
};

const FALLBACK_CONFIG = {
    title: 'Hiba',
    subtitle: 'Valami elromlott',
    description: 'Ismeretlen hiba történt. Kérjük, próbáld újra később.',
    glowColor: 'rgba(239,68,68,0.15)',
    accentColor: '#ef4444',
};

export default function Error({ status, message, fallbackUrl }: ErrorProps) {
    const config = ERROR_CONFIG[status] ?? FALLBACK_CONFIG;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAction = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        if (status === 419 || status === 429 || status === 503) {
            window.location.reload();

            return;
        }

        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/dashboard', { replace: true });
        }
    };

    const digits = config.title.split('');
    const buttonLabel = (status === 419 || status === 429 || status === 503)
        ? 'Oldal frissítése'
        : 'Vissza az előző oldalra';

    return (
        <>
            <Head title={`${status} — ${config.subtitle}`} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

                .error-root {
                    font-family: 'Syne', sans-serif;
                    min-height: 100vh;
                    background: #09090b;
                    color: #fafafa;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .bg-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
                    background-size: 48px 48px;
                    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
                    pointer-events: none;
                }

                .bg-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    background: var(--glow);
                    filter: blur(120px);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    animation: pulse-glow 4s ease-in-out infinite;
                }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
                }

                .content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    max-width: 560px;
                    width: 100%;
                    animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .status-display {
                    font-family: 'Space Mono', monospace;
                    font-size: clamp(96px, 20vw, 160px);
                    font-weight: 700;
                    line-height: 1;
                    letter-spacing: -0.04em;
                    display: flex;
                    justify-content: center;
                    gap: 0.02em;
                    margin-bottom: 0.1em;
                }

                .digit {
                    display: inline-block;
                    color: transparent;
                    -webkit-text-stroke: 1.5px var(--accent);
                    text-shadow: 0 0 60px var(--accent);
                    animation: digit-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                    position: relative;
                }

                .digit::before {
                    content: attr(data-char);
                    position: absolute;
                    inset: 0;
                    color: var(--accent);
                    opacity: 0.08;
                    filter: blur(8px);
                }

                .digit:nth-child(1) { animation-delay: 0.05s; }
                .digit:nth-child(2) { animation-delay: 0.12s; }
                .digit:nth-child(3) { animation-delay: 0.19s; }

                @keyframes digit-in {
                    from { opacity: 0; transform: translateY(-16px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0 auto 1.5rem;
                    max-width: 320px;
                    animation: fade-up 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .divider-line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
                }

                .divider-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: var(--accent);
                    box-shadow: 0 0 8px var(--accent);
                }

                .subtitle {
                    font-size: 1.375rem;
                    font-weight: 700;
                    color: #fafafa;
                    margin: 0 0 0.75rem;
                    animation: fade-up 0.6s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .description {
                    font-size: 0.9375rem;
                    color: #71717a;
                    line-height: 1.65;
                    margin: 0 0 2.25rem;
                    animation: fade-up 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .custom-message {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    padding: 10px 16px;
                    font-family: 'Space Mono', monospace;
                    font-size: 0.8125rem;
                    color: #a1a1aa;
                    margin-bottom: 2rem;
                    animation: fade-up 0.6s 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .custom-message::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--accent);
                    flex-shrink: 0;
                    box-shadow: 0 0 6px var(--accent);
                }

                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    align-items: center;
                    animation: fade-up 0.6s 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--accent);
                    color: #09090b;
                    font-family: 'Syne', sans-serif;
                    font-size: 0.9375rem;
                    font-weight: 700;
                    padding: 13px 28px;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    text-decoration: none;
                    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
                    box-shadow: 0 0 0 0 var(--accent);
                    width: 100%;
                    max-width: 320px;
                    justify-content: center;
                }

                .btn-primary:hover {
                    opacity: 0.88;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px -4px var(--accent-shadow, rgba(0,0,0,0.4));
                }

                .btn-primary:active {
                    transform: translateY(0);
                }
            `}</style>

            <div
                className="error-root"
                style={{
                    '--accent': config.accentColor,
                    '--accent-shadow': config.glowColor,
                    '--glow': config.glowColor,
                } as React.CSSProperties}
            >
                <div className="bg-grid" />
                <div className="bg-glow" />

                <div className="content">
                    <div className="status-display" aria-label={`HTTP ${status}`}>
                        {digits.map((d, i) => (
                            <span key={i} className="digit" data-char={d}>{d}</span>
                        ))}
                    </div>

                    <div className="divider">
                        <div className="divider-line" />
                        <div className="divider-dot" />
                        <div className="divider-line" />
                    </div>

                    <h1 className="subtitle">{config.subtitle}</h1>
                    <p className="description">{config.description}</p>

                    {message && message !== config.subtitle && (
                        <div className="custom-message">{message}</div>
                    )}

                    <div className="actions">
                        <a
                            href={fallbackUrl || "/"}
                            onClick={handleAction}
                            className="btn-primary"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {status === 419 || status === 429 || status === 503 ? (
                                    <>
                                        <polyline points="23 4 23 10 17 10"></polyline>
                                        <polyline points="1 20 1 14 7 14"></polyline>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                    </>
                                ) : (
                                    <>
                                        <path d="m15 18-6-6 6-6"/>
                                    </>
                                )}
                            </svg>
                            {buttonLabel}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

Error.layout = (page: React.ReactNode) => <>{page}</>;
