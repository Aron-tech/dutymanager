import { router } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import '../../css/dutymanager.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const goDocs = () => router.visit("/docs");
    const goHome = () => router.visit("/");

    return (
        <>
            <nav className={`nav-bar ${scrolled ? "scrolled" : ""}`}>
                <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                    <div onClick={goHome} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        {/* LOGO marad */}
                        <span className="font-display">DutyManager</span>
                    </div>

                    <div className="desktop-nav">
            <span className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView()}>
              Funkciók
            </span>
                        <span className="nav-link" onClick={() => document.getElementById("stats")?.scrollIntoView()}>
              Statisztikák
            </span>
                        <span className="nav-link" onClick={goDocs}>
              Dokumentáció
            </span>
                    </div>

                    <div>
                        <button className="btn-primary">Discord</button>

                        <div className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            </nav>

            {mobileOpen && (
                <div id="mobile-nav">
                    <div onClick={() => { goDocs(); setMobileOpen(false); }}>
                        Dokumentáció
                    </div>
                </div>
            )}

            {children}
        </>
    );
}
