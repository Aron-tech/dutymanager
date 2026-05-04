import DutyManagerView from '@/features/duty-manager/view';
import RankSystemView from '@/features/rank-system/view';
import WarningSystemView from '@/features/warning-system/view';
import type { FeatureRegistryItem } from '@/types';

export const feature_registry: Record<string, FeatureRegistryItem> = {
    duty_manager: {
        id: 'duty_manager',
        title: 'Szolgálati idő funkció',
        description: 'Frakciók és szolgálati idők naplózása.',
        view: DutyManagerView,
    },
    warning_system: {
        id: 'warning_system',
        title: 'Figyelmeztetés funkció',
        description: '',
        view: WarningSystemView,
    },
    rank_system: {
        id: 'rank_system',
        title: 'Rang rendszer funkció',
        description: '',
        view: RankSystemView,
    },
};
