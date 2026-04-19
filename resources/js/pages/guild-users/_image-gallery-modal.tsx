import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { ImageIcon, Trash2, Upload, ExternalLink, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GuildUser, Image } from '@/types';

interface UserImageGalleryProps {
    user: GuildUser | null;
    onClose: () => void;
}

export default function UserImageGallery({
    user,
    onClose,
}: UserImageGalleryProps) {
    const file_input_ref = useRef<HTMLInputElement>(null);
    const [image_to_delete, setImageToDelete] = useState<number | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [is_loading, setIsLoading] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } =
        useForm({
            image: null as File | null,
        });

    const fetchImages = React.useCallback(async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.get(
                route('guild.users.image', user.id),
            );
            setImages(response.data.images || []);
        } catch (error) {
            toast.error('Hiba a képek betöltésekor.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchImages();
        } else {
            setImages([]);
            reset();
            clearErrors();
        }
    }, [user, fetchImages, reset, clearErrors]);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !data.image) {
            return;
        }

        const max_file_size = 10 * 1024 * 1024;

        if (data.image.size > max_file_size) {
            toast.error('A fájl túl nagy! Maximum 10MB megengedett.');

            return;
        }

        post(route('guild.users.image.store', user.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset('image');

                if (file_input_ref.current) {
                    file_input_ref.current.value = '';
                }
                fetchImages();
            },
        });
    };

    const confirmDelete = () => {
        if (image_to_delete === null) {
            return;
        }

        router.delete(route('guild.users.image.delete', image_to_delete), {
            preserveScroll: true,
            onSuccess: () => {
                setImageToDelete(null);
                fetchImages();
            },
        });
    };

    if (!user) {
        return null;
    }

    return (
        <>
            <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            {user.ic_name} képei
                        </DialogTitle>
                        <DialogDescription>
                            Feltöltött dokumentumok kezelése.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <form
                            onSubmit={handleUpload}
                            className="flex items-end gap-4 rounded-lg border bg-muted/30 p-4"
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="image_upload">
                                    Új kép feltöltése
                                </Label>
                                <Input
                                    id="image_upload"
                                    type="file"
                                    accept="image/jpeg, image/png, image/jpg"
                                    ref={file_input_ref}
                                    onChange={(e) => {
                                        setData(
                                            'image',
                                            e.target.files?.[0] || null,
                                        );
                                        clearErrors('image');
                                    }}
                                />
                                {errors.image && (
                                    <p className="text-sm font-medium text-destructive">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={processing || !data.image}
                            >
                                <Upload className="mr-2 h-4 w-4" /> Feltöltés
                            </Button>
                        </form>

                        {is_loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {images.map((img) => (
                                    <div
                                        key={img.id}
                                        className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                                    >
                                        <img
                                            src={img.url}
                                            className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
                                            onClick={() =>
                                                window.open(img.url, '_blank')
                                            }
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() =>
                                                    window.open(
                                                        img.url,
                                                        '_blank',
                                                    )
                                                }
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    setImageToDelete(img.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!is_loading && images.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <ImageIcon className="mb-2 h-10 w-10 opacity-20" />
                                <p>Nincs még kép feltöltve.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={image_to_delete !== null}
                onOpenChange={(open) => !open && setImageToDelete(null)}
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                            <Trash2 className="h-6 w-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Kép törlése?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A kép véglegesen törlődik a szerverről.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="outline">
                            Mégse
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Törlés
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
