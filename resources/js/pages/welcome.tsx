import MainLayout from "@/layouts/main-layout";
import { useEffect } from "react";
import { router } from "@inertiajs/react";

export default function Landing() {

    // NAVBAR SCROLL
    useEffect(() => {
        const nav = document.getElementById("navbar");
        const onScroll = () => {
            if (!nav) return;
            if (window.scrollY > 20) nav.classList.add("scrolled");
            else nav.classList.remove("scrolled");
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // STATS
    useEffect(() => {
        const values = [50000, 1200000, 99.99, 150];
        values.forEach((val, i) => {
            const el = document.getElementById(`stat${i}`);
            if (!el) return;
            let current = 0;
            const step = val / 60;
            const interval = setInterval(() => {
                current += step;
                if (current >= val) {
                    current = val;
                    clearInterval(interval);
                }
                el.innerText = i === 2
                    ? current.toFixed(2) + "%"
                    : Math.floor(current).toLocaleString();
            }, 25);
        });
    }, []);

    return (
        <MainLayout>
            <div id="page-landing" className="page active">

                {/* BACKGROUND LAYERS */}
                <div className="bg-noise"></div>
                <div className="bg-gradient"></div>

                {/* HERO */}
                <section className="hero-bg grid-bg" style={{ minHeight: "100vh", position: "relative", overflow: "hidden", paddingTop: 60 }}>

                    <div className="hero-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>

                        <div className="hero-pad" style={{ maxWidth: 900, margin: "0 auto", padding: "140px 24px 100px", textAlign: "center" }}>

                            <div className="badge-wrap" style={{ marginBottom: 28 }}>
                                <div className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span className="font-mono" style={{ color: "var(--cyan)", fontSize: 12 }}>
                    v3.0 Stabil — Most Elérhető
                  </span>
                                </div>
                            </div>

                            <h1 className="font-display hero-title" style={{ fontWeight: 800, lineHeight: 1.1 }}>
                                A Legjobb<br />
                                <span className="text-gradient">Discord Menedzsment</span><br />
                                Platform
                            </h1>

                            <p className="hero-sub" style={{ color: "var(--muted)", marginTop: 20, fontSize: 16 }}>
                                DutyManager v3 — komolyabb Discord közösségek számára.
                            </p>

                            <div className="cta-btns" style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center" }}>
                                <button className="btn-primary">Hozzáadás Discordhoz</button>
                                <button className="btn-ghost" onClick={() => router.visit("/docs")}>
                                    Dokumentáció
                                </button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* STATS */}
                <section id="stats" className="section-pad" style={{ padding: "100px 24px" }}>
                    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>

                        <div className="stat-grid">

                            <div className="card stat-top">
                                <div className="stat-value" id="stat0">0</div>
                                <div className="stat-label">Aktív Szerver</div>
                            </div>

                            <div className="card stat-top">
                                <div className="stat-value" id="stat1">0</div>
                                <div className="stat-label">Kiszolgált Felhasználó</div>
                            </div>

                            <div className="card stat-top">
                                <div className="stat-value" id="stat2">0</div>
                                <div className="stat-label">Uptime</div>
                            </div>

                            <div className="card stat-top">
                                <div className="stat-value" id="stat3">0</div>
                                <div className="stat-label">Slash Parancs</div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="section-pad" style={{ padding: "120px 24px" }}>
                    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>

                        <div className="feature-grid">

                            <div className="card feature-card">
                                <div className="feature-icon"></div>
                                <h3 className="font-display">Ticket Rendszer</h3>
                                <p>Fejlett ticket kezelés automatikus hozzárendeléssel.</p>
                            </div>

                            <div className="card feature-card">
                                <div className="feature-icon"></div>
                                <h3 className="font-display">Stáb Kezelés</h3>
                                <p>Műszak követés és dashboardok.</p>
                            </div>

                            <div className="card feature-card">
                                <div className="feature-icon"></div>
                                <h3 className="font-display">Műszak Követés</h3>
                                <p>Automatizált logok és riportok.</p>
                            </div>

                            <div className="card feature-card">
                                <div className="feature-icon"></div>
                                <h3 className="font-display">Auto-Moderáció</h3>
                                <p>Szabály alapú moderálás.</p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* COMMANDS */}
                <section id="commands" className="section-pad" style={{ padding: "120px 24px" }}>
                    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>

                        <div className="code-window">
                            <div className="cmd-row"><span className="font-mono">/duty on</span></div>
                            <div className="cmd-row"><span className="font-mono">/duty off</span></div>
                            <div className="cmd-row"><span className="font-mono">/ticket create</span></div>
                            <div className="cmd-row"><span className="font-mono">/stats server</span></div>
                        </div>

                    </div>
                </section>

                {/* CTA */}
                <section className="section-pad" style={{ padding: "140px 24px" }}>
                    <div className="container" style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>

                        <div className="card">
                            <h2 className="font-display">Készen állsz felturbózni a Discord szervered?</h2>
                            <p style={{ color: "var(--muted)", marginTop: 10 }}>
                                Csatlakozz a több tízezer szerverhez.
                            </p>
                            <button className="btn-primary" style={{ marginTop: 20 }}>
                                Hozzáadás — Ingyenes
                            </button>
                        </div>

                    </div>
                </section>

                {/* FOOTER */}
                <footer className="footer" style={{ padding: "60px 24px" }}>
                    <div className="container" style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <div className="footer-grid">

                            <div>
                                <h4>DutyManager</h4>
                                <p style={{ color: "var(--muted)" }}>Modern Discord menedzsment.</p>
                            </div>

                            <div>
                                <h5>Linkek</h5>
                                <div className="footer-links">
                                    <span onClick={() => router.visit("/")}>Főoldal</span>
                                    <span onClick={() => router.visit("/docs")}>Dokumentáció</span>
                                </div>
                            </div>

                            <div>
                                <h5>Közösség</h5>
                                <div className="footer-links">
                                    <span>Discord</span>
                                    <span>GitHub</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </footer>

            </div>
        </MainLayout>
    );
}
