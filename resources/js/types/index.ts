export type * from './auth';
export type * from './navigation';
export type * from './ui';

export interface ActivityLog {
    id: number;
    guild_id: string | null;
    user_id: string | null;
    target_id: string | null;
    action: string;
    details: Record<string, any> | null;
    created_at: string;
}

export interface Duty {
    id: number;
    guild_user_id: number;
    value: number;
    started_at: string;
    finished_at: string | null;
    status: string; // TBD: DutyStatusEnum cserélendő pontos típusra
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Guild {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    is_installed: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relációk
    guild_settings?: GuildSettings;
    guild_users?: GuildUser[];
    users?: User[];
}

export interface GuildRole {
    id: number;
    permissions: any[];
    // TBD: Hiányzó mezők pótlása
    created_at: string;
    updated_at: string;
}

export interface GuildSettings {
    guild_id: string;
    current_view: string;
    features: string[];
    feature_settings: Record<string, Record<string, any>>;
    user_details_config: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface GuildUser {
    id: number;
    user_id: string;
    guild_id: string;
    ic_name: string | null;
    details: Record<string, any> | null;
    is_request: boolean;
    accepted_at: string | null;
    added_by: string | null;
    created_at: string;
    updated_at: string;

    // Relációk
    user?: User;
    guild?: Guild;
}

export interface Subscription {
    id: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    name: string;
    global_name: string | null;
    email: string | null;
    avatar_url: string | null;
    lang_code: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relációk
    guild_users?: GuildUser[];
    guilds?: Guild[];
}

export interface FeatureViewProps {
    data: Record<string, any>;
    context_data: Record<string, any>;
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
}

export interface FeatureRegistryItem {
    id: string;
    title: string;
    description: string;
    is_core?: boolean;
    view: React.FC<FeatureViewProps>;
}

export interface DiscordRole {
    id: string;
    name: string;
    color?: number | string;
}

export interface DiscordChannel {
    id: string;
    name: string;
    type?: number;
}
