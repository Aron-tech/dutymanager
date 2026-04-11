import DutyManagerView from '@/features/duty-manager/view';
import type { FeatureRegistryItem } from '@/types';

export const feature_registry: Record<string, FeatureRegistryItem> = {
    duty_manager: {
        id: 'duty_manager',
        title: 'Szolgálati idő funkció',
        description: 'Frakciók és szolgálati idők naplózása.',
        view: DutyManagerView,
    },
    warn_system: {
        id: 'warn_system',
        title: 'Figyelmeztetés funkció',
        description: '',
        view: DutyManagerView,
    },
    rank_system: {
        id: 'rank_system',
        title: 'Rang rendszer funkció',
        description: '',
        view: DutyManagerView,
    },
};
