import { useState } from "react";
import MainLayout from "@/layouts/main-layout";

export default function Docs() {
    const [active, setActive] = useState("intro");

    const show = (id: string) => setActive(id);

    return (
        <MainLayout>
            <div id="page-docs" className="page active">
                <div className="docs-layout" style={{ paddingTop: 60 }}>

                    <aside className="docs-sidebar">
                        <div className={`sidebar-link ${active === "intro" ? "active" : ""}`} onClick={() => show("intro")}>
                            Bevezetés
                        </div>
                        <div className={`sidebar-link ${active === "install" ? "active" : ""}`} onClick={() => show("install")}>
                            Telepítés
                        </div>
                    </aside>

                    <main className="docs-content">

                        {active === "intro" && (
                            <div id="doc-intro">
                                <h1>Üdvözlünk</h1>
                            </div>
                        )}

                        {active === "install" && (
                            <div id="doc-install">
                                <h1>Telepítés</h1>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </MainLayout>
    );
}
