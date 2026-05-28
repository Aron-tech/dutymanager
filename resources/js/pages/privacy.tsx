import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import LegalPage from '@/components/site/legal-page';

interface SharedPageProps {
    translations: Record<string, any>;
    [key: string]: any;
}

export default function Privacy() {
    const { props } = usePage<SharedPageProps>();

    const __ = (key: string, replace: Record<string, string | number> = {}): string => {
        const parts = key.split('.');
        let translation: any = props.translations;

        for (const part of parts) {
            if (translation && translation[part] !== undefined) {
                translation = translation[part];
            } else {
                translation = key;
                break;
            }
        }

        if (typeof translation !== 'string') {
            return key;
        }

        Object.keys(replace).forEach((token) => {
            translation = translation.replace(`:${token}`, String(replace[token]));
        });

        return translation;
    };

    return (
        <MainLayout>
            <Head title={__('legal.privacy.meta.title')} />

            <LegalPage title={__('legal.privacy.header.title')} last_updated="May 28, 2026">
                <p>
                    {__('legal.privacy.intro')}
                </p>

                <h2>{__('legal.privacy.section_1.title')}</h2>
                <p>{__('legal.privacy.section_1.intro')}</p>
                <ul>
                    <li><strong>{__('legal.privacy.section_1.list_item_1.term')}:</strong> {__('legal.privacy.section_1.list_item_1.description')}</li>
                    <li><strong>{__('legal.privacy.section_1.list_item_2.term')}:</strong> {__('legal.privacy.section_1.list_item_2.description')}</li>
                    <li><strong>{__('legal.privacy.section_1.list_item_3.term')}:</strong> {__('legal.privacy.section_1.list_item_3.description')}</li>
                    <li><strong>{__('legal.privacy.section_1.list_item_4.term')}:</strong> {__('legal.privacy.section_1.list_item_4.description')}</li>
                    <li><strong>{__('legal.privacy.section_1.list_item_5.term')}:</strong> {__('legal.privacy.section_1.list_item_5.description')}</li>
                    <li><strong>{__('legal.privacy.section_1.list_item_6.term')}:</strong> {__('legal.privacy.section_1.list_item_6.description')}</li>
                </ul>
                <p>
                    {__('legal.privacy.section_1.outro')}
                </p>

                <h2>{__('legal.privacy.section_2.title')}</h2>
                <p>
                    {__('legal.privacy.section_2.content')}
                </p>

                <h2>{__('legal.privacy.section_3.title')}</h2>
                <ul>
                    <li>{__('legal.privacy.section_3.list_item_1')}</li>
                    <li>{__('legal.privacy.section_3.list_item_2')}</li>
                    <li>{__('legal.privacy.section_3.list_item_3')}</li>
                    <li>{__('legal.privacy.section_3.list_item_4')}</li>
                </ul>

                <h2>{__('legal.privacy.section_4.title')}</h2>
                <p>
                    {__('legal.privacy.section_4.content_part_1')}{' '}
                    <a href="https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service" target="_blank" rel="noreferrer">{__('legal.privacy.section_4.link_1')}</a>{' '}
                    {__('legal.privacy.section_4.content_part_2')}{' '}
                    <a href="https://discord.com/developers/docs/policies-and-agreements/developer-policy" target="_blank" rel="noreferrer">{__('legal.privacy.section_4.link_2')}</a>.
                    {__('legal.privacy.section_4.content_part_3')}
                </p>

                <h2>{__('legal.privacy.section_5.title')}</h2>
                <p>
                    {__('legal.privacy.section_5.content')}
                </p>

                <h2>{__('legal.privacy.section_6.title')}</h2>
                <p>
                    {__('legal.privacy.section_6.content')}
                </p>

                <h2>{__('legal.privacy.section_7.title')}</h2>
                <p>
                    {__('legal.privacy.section_7.content')}
                </p>

                <h2>{__('legal.privacy.section_8.title')}</h2>
                <p>
                    {__('legal.privacy.section_8.content')}
                </p>

                <h2>{__('legal.privacy.section_9.title')}</h2>
                <p>
                    {__('legal.privacy.section_9.content')}
                </p>

                <h2>{__('legal.privacy.section_10.title')}</h2>
                <p>
                    {__('legal.privacy.section_10.content')}
                </p>

                <h2>{__('legal.privacy.section_11.title')}</h2>
                <p>
                    {__('legal.privacy.section_11.content_part_1')}{' '}
                    <a href="https://discord.gg/JyPa9dhwhx" target="_blank" rel="noreferrer">{__('legal.privacy.section_11.link_1')}</a>{' '}
                    {__('legal.privacy.section_11.content_part_2')}{' '}
                    <a href="mailto:support@dutymanager.app">support@dutymanager.app</a>.
                </p>

                <p className="!text-white/40 !text-sm">
                    {__('legal.disclaimer')}
                </p>
            </LegalPage>
        </MainLayout>
    );
}
