import { useForm, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Item } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    type: 'clothing' | 'vehicle';
    item?: Item | null;
}

export default function CreateEditItemModal({ isOpen, onClose, type, item }: Props) {
    const isEditing = !!item;
    const isVehicle = type === 'vehicle';

    // Állapotok a kép törléséhez
    const [show_image_delete, setShowImageDelete] = useState(false);
    const [is_deleting_image, setIsDeletingImage] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            _method: isEditing ? 'put' : 'post',
            name: '',
            price: '',
            type: type,
            roles: '',
            image: null as File | null,
            spawn_code: '',
            max_speed: '',
            season: '',
            mask: '',
            jackets: '',
            body_armor: '',
            hands: '',
            decals: '',
            hats: '',
            ears: '',
            scarves_chains: '',
            shirts: '',
            bags: '',
            pants: '',
            shoes: '',
            glasses: '',
            watches: '',
        });

    useEffect(() => {
        if (isOpen) {
            setData({
                _method: isEditing ? 'put' : 'post',
                name: item?.name || '',
                price: item?.price?.toString() || '',
                type: item?.type || type,
                roles: item?.details?.roles?.join(', ') || '',
                image: null,
                spawn_code: item?.details?.spawn_code || '',
                max_speed: item?.details?.max_speed?.toString() || '',
                season: item?.details?.season || '',
                mask: item?.details?.mask || '',
                jackets: item?.details?.jackets || '',
                body_armor: item?.details?.body_armor || '',
                hands: item?.details?.hands || '',
                decals: item?.details?.decals || '',
                hats: item?.details?.hats || '',
                ears: item?.details?.ears || '',
                scarves_chains: item?.details?.scarves_chains || '',
                shirts: item?.details?.shirts || '',
                bags: item?.details?.bags || '',
                pants: item?.details?.pants || '',
                shoes: item?.details?.shoes || '',
                glasses: item?.details?.glasses || '',
                watches: item?.details?.watches || '',
            });
        }
    }, [isOpen, item, type]);

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();

        const routeName = isEditing
            ? route('items.update', item.id)
            : route('items.store');

        post(routeName, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleDeleteImage = () => {
        if (!item) return;
        setIsDeletingImage(true);
        router.delete(route('items.image.destroy', item.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowImageDelete(false);
            },
            onFinish: () => setIsDeletingImage(false),
        });
    };

    const handleDetailChange = (field: string, index: 0 | 1, value: string) => {
        const current = (data[field as keyof typeof data] as string) || '';
        const parts = current.includes('-') ? current.split('-').map(s => s.trim()) : ['', ''];
        parts[index] = value;

        if (!parts[0] && !parts[1]) {
            setData(field as any, '');
        } else {
            setData(field as any, `${parts[0]} - ${parts[1]}`);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {isVehicle ? 'Jármű' : 'Ruházat'} {isEditing ? 'Szerkesztése' : 'Hozzáadása'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Módosítsd az adatokat és mentsd el a változásokat.' : 'Töltsd ki a szükséges adatokat.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-6 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Név *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Ár (Ft)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                />
                                <InputError message={errors.price} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="image">Kép feltöltése {!isEditing && '*'}</Label>

                                {isEditing && item?.image && (
                                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-2 mb-2">
                                        <img src={item.image.url} alt="Kép" className="h-10 w-10 rounded object-cover" />
                                        <span className="flex-1 text-sm font-medium text-muted-foreground">Aktuális kép</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => setShowImageDelete(true)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    className="cursor-pointer"
                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                    required={!isEditing && !item?.image}
                                />
                                <InputError message={errors.image} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="roles">Rangok (Vesszővel elválasztva)</Label>
                                <Input
                                    id="roles"
                                    placeholder="Pl.: VIP, Admin, Rendőr"
                                    value={data.roles}
                                    onChange={(e) => setData('roles', e.target.value)}
                                />
                                <InputError message={errors.roles} />
                            </div>
                        </div>

                        {isVehicle ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border bg-muted/10 p-5 shadow-sm">
                                <div className="space-y-2">
                                    <Label htmlFor="spawn_code">Lehívó (Spawn kód)</Label>
                                    <Input
                                        id="spawn_code"
                                        value={data.spawn_code}
                                        onChange={(e) => setData('spawn_code', e.target.value)}
                                    />
                                    <InputError message={errors.spawn_code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_speed">Max. Sebesség (km/h)</Label>
                                    <Input
                                        id="max_speed"
                                        type="number"
                                        min="0"
                                        value={data.max_speed}
                                        onChange={(e) => setData('max_speed', e.target.value)}
                                    />
                                    <InputError message={errors.max_speed} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 rounded-xl border bg-muted/10 p-5 shadow-sm">
                                <div className="space-y-2">
                                    <Label htmlFor="season">Szezon</Label>
                                    <Input
                                        id="season"
                                        placeholder="Pl.: Tél, Nyár"
                                        value={data.season}
                                        onChange={(e) => setData('season', e.target.value)}
                                    />
                                    <InputError message={errors.season} />
                                </div>

                                <div className="border-t border-border/50 pt-4">
                                    <p className="text-sm font-semibold mb-4 text-muted-foreground">Részletek megadása</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
                                        {[
                                            'mask', 'jackets', 'body_armor', 'hands', 'decals', 'hats', 'ears',
                                            'scarves_chains', 'shirts', 'bags', 'pants', 'shoes', 'glasses', 'watches',
                                        ].map((field) => {
                                            const current = (data[field as keyof typeof data] as string) || '';
                                            const parts = current.includes('-') ? current.split('-').map(s => s.trim()) : ['', ''];

                                            return (
                                                <div key={field} className="space-y-1.5">
                                                    <Label htmlFor={`${field}-0`} className="text-xs font-semibold capitalize tracking-wide text-foreground/80">
                                                        {field.replace('_', ' ')}
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id={`${field}-0`}
                                                            placeholder="1"
                                                            value={parts[0]}
                                                            onChange={e => handleDetailChange(field, 0, e.target.value)}
                                                            className="text-center h-9"
                                                        />
                                                        <span className="text-muted-foreground/50 font-medium">-</span>
                                                        <Input
                                                            placeholder="5"
                                                            value={parts[1]}
                                                            onChange={e => handleDetailChange(field, 1, e.target.value)}
                                                            className="text-center h-9"
                                                        />
                                                    </div>
                                                    <InputError message={errors[field as keyof typeof errors]} className="text-[10px]" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4 border-t border-border/50">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                                Mégse
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {isEditing ? 'Mentés' : 'Létrehozás'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                isOpen={show_image_delete}
                onClose={() => setShowImageDelete(false)}
                onConfirm={handleDeleteImage}
                isProcessing={is_deleting_image}
                description="Biztosan törölni szeretnéd a jelenlegi képet? Ez a művelet azonnal végrehajtódik."
            />
        </>
    );
}
