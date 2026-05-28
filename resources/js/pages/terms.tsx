import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import LegalPage from '@/components/site/legal-page';

export default function Terms() {
    return (
        <MainLayout>
            <Head title="Terms of Service — DutyManager v3" />

            <LegalPage title="Terms of Service" last_updated="May 28, 2026">
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your access to and use of the DutyManager v3 Discord bot,
                    its associated web dashboard, and related services (collectively, the &quot;Service&quot;). By inviting the
                    bot to a Discord server or using the Service, you agree to be bound by these Terms. If you do not agree, do
                    not use the Service.
                </p>

                <h2>1. Eligibility</h2>
                <p>
                    You must comply with the <a href="https://discord.com/terms" target="_blank" rel="noreferrer">Discord Terms of Service</a>{' '}
                    and meet Discord&apos;s minimum age requirement for your jurisdiction to use the Service. By using the Service
                    on a Discord server, you represent that you have the authority to bind that server to these Terms.
                </p>

                <h2>2. Description of the Service</h2>
                <p>
                    DutyManager v3 provides duty-time tracking, member management, a punishment system, and holiday management
                    through Discord slash commands and a synchronized web dashboard. Features may be added, changed, or removed at
                    any time. Some features are available only with a Premium subscription.
                </p>

                <h2>3. Premium Subscriptions</h2>
                <p>
                    Premium subscriptions unlock additional features. <strong>Premium subscriptions can exclusively be purchased
                    via our Discord server.</strong> All purchases are subject to the terms presented at the point of sale. Unless
                    required by applicable law, payments are non-refundable. We reserve the right to change pricing and the
                    features included in any plan.
                </p>

                <h2>4. Acceptable Use</h2>
                <p>You agree that you will not:</p>
                <ul>
                    <li>Use the Service to violate the Discord Terms of Service, Community Guidelines, or any applicable law.</li>
                    <li>Attempt to disrupt, overload, reverse engineer, or gain unauthorized access to the Service or its infrastructure.</li>
                    <li>Abuse, automate, or exploit commands in a way that degrades the experience for other users.</li>
                    <li>Use the Service to harass, abuse, or harm others, or to store unlawful content.</li>
                </ul>

                <h2>5. Discord API Compliance</h2>
                <p>
                    The Service operates as a Discord application and relies on the Discord API. Your use of the Service is also
                    governed by the <a href="https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service" target="_blank" rel="noreferrer">Discord Developer Terms of Service</a>{' '}
                    and <a href="https://discord.com/developers/docs/policies-and-agreements/developer-policy" target="_blank" rel="noreferrer">Developer Policy</a>.
                    We handle Discord data in accordance with those policies, and access to Discord-provided data may be limited or
                    revoked by Discord at any time, which may affect the Service.
                </p>

                <h2>6. Data and Message Caching</h2>
                <p>
                    To deliver its features, the Service stores configuration data, member records, duty totals, punishments, and
                    holidays associated with your server. The bot may temporarily cache message and interaction data in memory to
                    process commands; such cache is transient and is not retained longer than necessary. Details of what we store
                    and for how long are described in our <a href="/privacy">Privacy Policy</a>.
                </p>

                <h2>7. Availability and Disclaimer of Warranties</h2>
                <p>
                    The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any
                    kind, whether express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or
                    that data will never be lost. You are responsible for maintaining your own records where appropriate.
                </p>

                <h2>8. Limitation of Liability</h2>
                <p>
                    To the maximum extent permitted by law, the operators of DutyManager v3 shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill arising from
                    your use of, or inability to use, the Service.
                </p>

                <h2>9. Termination</h2>
                <p>
                    We may suspend or terminate access to the Service at any time, with or without notice, for conduct that we
                    believe violates these Terms or is harmful to other users, the Service, or third parties. You may stop using
                    the Service at any time by removing the bot from your server.
                </p>

                <h2>10. Changes to These Terms</h2>
                <p>
                    We may update these Terms from time to time. Material changes will be communicated through our Discord server or
                    the Service. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
                </p>

                <h2>11. Contact</h2>
                <p>
                    Questions about these Terms can be directed to our{' '}
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
