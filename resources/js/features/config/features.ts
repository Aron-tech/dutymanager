import DutyManagerView from '@/features/duty-manager/view';
import type { FeatureRegistryItem } from '@/types';

export const feature_registry: Record<string, FeatureRegistryItem> = {
    duty_manager: {
        id: 'duty_manager',
        title: 'Szolgálat Kezelő',
        description: 'Frakciók és szolgálati idők naplózása.',
        view: DutyManagerView,
    },
};
