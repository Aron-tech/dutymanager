import { useState } from 'react';

export type UseTwoFactorAuthReturn = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    hasSetupData: boolean;
    errors: string[];
    clearErrors: () => void;
    clearSetupData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const hasSetupData = qrCodeSvg !== null && manualSetupKey !== null;

    const clearErrors = (): void => {
        setErrors([]);
    };

    const clearSetupData = (): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        clearErrors();
    };

    const recoveryCodesList: string[] = [];

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        fetchQrCode: function (): Promise<void> {
            throw new Error('Function not implemented.');
        },
        fetchSetupKey: function (): Promise<void> {
            throw new Error('Function not implemented.');
        },
        fetchSetupData: function (): Promise<void> {
            throw new Error('Function not implemented.');
        },
        fetchRecoveryCodes: function (): Promise<void> {
            throw new Error('Function not implemented.');
        },
    };
};
