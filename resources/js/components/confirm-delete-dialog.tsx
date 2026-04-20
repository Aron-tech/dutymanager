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

export interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing?: boolean;
    title?: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
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
}: ConfirmDeleteDialogProps) {
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
                            onConfirm();
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
