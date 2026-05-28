import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import LegalPage from '@/components/site/legal-page';

export default function Privacy() {
    return (
        <MainLayout>
            <Head title="Privacy Policy — DutyManager v3" />

            <LegalPage title="Privacy Policy" last_updated="May 28, 2026">
                <p>
                    This Privacy Policy explains what data the DutyManager v3 Discord bot and its web dashboard (the
                    &quot;Service&quot;) collect, how it is used, and the choices you have. By using the Service, you consent to
                    the practices described below.
                </p>

                <h2>1. Data We Collect</h2>
                <p>To provide its features, the Service stores the following categories of data:</p>
                <ul>
                    <li><strong>Discord identifiers:</strong> server (guild) IDs, channel IDs, role IDs, and user IDs.</li>
                    <li><strong>Member records:</strong> usernames, nicknames, assigned ranks, and related metadata required for management features.</li>
                    <li><strong>Duty data:</strong> on-duty sessions and accumulated time totals per period.</li>
                    <li><strong>Punishment data:</strong> verbal warnings, warnings, and blacklists, including reasons, levels, and expiry.</li>
                    <li><strong>Holiday data:</strong> registered time-off periods and reasons.</li>
                    <li><strong>Configuration:</strong> per-server settings and enabled features.</li>
                </ul>
                <p>
                    We do not intentionally collect sensitive personal information, and we do not sell your data to third parties.
                </p>

                <h2>2. Message Caching</h2>
                <p>
                    The Service primarily operates through slash commands and interactions rather than reading general chat
                    messages. When required to process a command, the bot may temporarily hold message or interaction content in
                    memory (a transient cache). This cache is short-lived, is used only to fulfill the requested action, and is not
                    written to long-term storage unless a feature you use explicitly requires it (for example, logging an action you
                    performed).
                </p>

                <h2>3. How We Use Data</h2>
                <ul>
                    <li>To operate and provide the bot&apos;s commands and dashboard features.</li>
                    <li>To maintain duty totals, punishments, holidays, and server configuration.</li>
                    <li>To synchronize data between Discord and the web dashboard.</li>
                    <li>To diagnose issues, prevent abuse, and improve reliability of the Service.</li>
                </ul>

                <h2>4. Legal Basis and Discord API</h2>
                <p>
                    The Service accesses data through the Discord API and complies with the{' '}
                    <a href="https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service" target="_blank" rel="noreferrer">Discord Developer Terms of Service</a>{' '}
                    and <a href="https://discord.com/developers/docs/policies-and-agreements/developer-policy" target="_blank" rel="noreferrer">Developer Policy</a>.
                    We process Discord data only to provide the features you and your server administrators enable.
                </p>

                <h2>5. Data Retention</h2>
                <p>
                    We retain stored data for as long as the bot remains in your server and the data is needed to provide the
                    Service. When the bot is removed from a server, or upon a valid deletion request, associated server data is
                    deleted or anonymized within a reasonable period, except where retention is required by law or for legitimate
                    operational purposes such as abuse prevention.
                </p>

                <h2>6. Data Sharing</h2>
                <p>
                    We do not sell personal data. We may share limited data with infrastructure providers (such as hosting and
                    database providers) strictly to operate the Service, and where required by law or to protect our rights, users,
                    or the public.
                </p>

                <h2>7. Security</h2>
                <p>
                    We take reasonable technical and organizational measures to protect stored data against unauthorized access,
                    alteration, or destruction. However, no method of transmission or storage is completely secure, and we cannot
                    guarantee absolute security.
                </p>

                <h2>8. Your Rights</h2>
                <p>
                    Depending on your jurisdiction, you may have the right to access, correct, or request deletion of data
                    associated with you. Server administrators can remove data by deleting member records via the bot&apos;s
                    commands or by removing the bot. To make a data request, contact us through the channels below.
                </p>

                <h2>9. Children&apos;s Privacy</h2>
                <p>
                    The Service is not directed to individuals below Discord&apos;s minimum age requirement. We do not knowingly
                    collect data from such individuals. If you believe a minor has provided data, please contact us so we can
                    remove it.
                </p>

                <h2>10. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. Material changes will be communicated through our Discord
                    server or the Service. Continued use after changes take effect constitutes acceptance of the revised policy.
                </p>

                <h2>11. Contact</h2>
                <p>
                    For privacy questions or data requests, reach us on our{' '}
                    <a href="https://discord.gg/JyPa9dhwhx" target="_blank" rel="noreferrer">Discord support server</a> or by email
                    at <a href="mailto:support@dutymanager.app">support@dutymanager.app</a>.
                </p>

                <p className="!text-white/40 !text-sm">
                    DutyManager v3 is not affiliated with, endorsed, or sponsored by Discord Inc. &quot;Discord&quot; is a
                    trademark of Discord Inc.
                </p>
            </LegalPage>
        </MainLayout>
    );
}
