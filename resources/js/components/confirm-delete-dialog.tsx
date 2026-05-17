import { Trash2 } from 'lucide-react';
import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

export interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (checkbox_value?: boolean) => void;
    isProcessing?: boolean;
    title?: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    checkboxText?: string;
}

export function ConfirmDeleteDialog({
                                        isOpen,
                                        onClose,
                                        onConfirm,
                                        isProcessing = false,
                                        title = 'Törlés megerősítése',
                                        description,
                                        confirmText = 'Törlés',
                                        cancelText = 'Mégse',
                                        checkboxText,
                                    }: ConfirmDeleteDialogProps) {
    const [checkboxValue, setCheckboxValue] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setCheckboxValue(false);
        }
    }, [isOpen]);

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(open) => !open && !isProcessing && onClose()}
        >
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                        <Trash2 className="h-6 w-6" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {checkboxText && (
                    <div className="flex items-center space-x-2 mt-4">
                        <Checkbox id="confirm_checkbox" checked={checkboxValue} onCheckedChange={(checked) => setCheckboxValue(Boolean(checked))} />
                        <label
                            htmlFor="confirm_checkbox"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {checkboxText}
                        </label>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm(checkboxValue);
                        }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Folyamatban...' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
