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
    status: string;
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
    user_details_config: UserDetailsConfig[];
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

    user?: User;
    guild?: Guild;
    images?: Image[];

    current_period_duties_sum_value?: number;
    all_period_duties_sum_value?: number;
    joined_ago?: string;
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

export interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface UserDetailsConfig {
    name: string;
    type: string;
    required: boolean;
}

export interface Rank {
    id: string;
    name: string;
}

export interface SelectItem {
    value: string;
    label: string;
}

export interface Image {
    id: number;
    url: string;
    path: string;
}

export enum PunishmentType {
    VERBAL_WARNING = 'verbal_warning',
    WARNING = 'warning',
    BLACKLIST = 'blacklist'
}
export interface Punishment {
    id: number;
    user_id: string;
    guild_id: string;
    type: PunishmentType;
    level?: number;
    reason: string;
    expires_at?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    user?: User;
    guild?: Guild;
    createdBy?: User;
}

export interface TableFilters {
    search?: string;
    per_page?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface UserManagerProps {
    guild_users: PaginatedData<GuildUser>;
    user_details_config: UserDetailsConfig[];
    unattached_guild_users: DiscordSelectItem[];
    filters: TableFilters;
    has_rank_system?: boolean;
    available_ranks?: Rank[];
}

export interface ItemDetails {
    roles?: string[];
    season?: string;
    spawn_code?: string;
    max_speed?: string | number;
    mask?: string;
    jackets?: string;
    body_armor?: string;
    hands?: string;
    decals?: string;
    hats?: string;
    ears?: string;
    scarves_chains?: string;
    shirts?: string;
    bags?: string;
    pants?: string;
    shoes?: string;
    glasses?: string;
    watches?: string;
    [key: string]: any;
}

export interface Item {
    id: number;
    type: 'clothing' | 'vehicle';
    name: string;
    details?: ItemDetails;
    image?: Image | null;
}
