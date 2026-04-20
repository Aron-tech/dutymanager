import { Head, router } from '@inertiajs/react';
import {
    Car,
    Shirt,
    ChevronLeft,
    ChevronRight,
    Gauge,
    KeyRound,
    SunSnow,
    Plus,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Item } from '@/types';
import ClothingDetailsModal from './_clothing-details-modal';
import CreateEditItemModal from './_create-edit-item-modal';

interface IndexProps {
    items: Item[];
    type: 'clothing' | 'vehicle';
}

export default function Index({ items, type }: IndexProps) {
    const [selected_item, setSelectedItem] = useState<Item | null>(null);
    const [editing_item, setEditingItem] = useState<Item | null>(null);
    const [deleting_item, setDeletingItem] = useState<Item | null>(null);
    const [is_deleting, setIsDeleting] = useState(false);
    const [is_create_modal_open, setIsCreateModalOpen] = useState(false);
    const [current_page, setCurrentPage] = useState(1);

    const items_per_page = 9;
    const is_vehicle = type === 'vehicle';
    const page_title = is_vehicle ? 'Járművek' : 'Ruházatok';

    const total_pages = Math.ceil((items?.length || 0) / items_per_page);
    const current_items =
        items?.slice(
            (current_page - 1) * items_per_page,
            current_page * items_per_page,
        ) || [];

    const handleDelete = () => {
        if (!deleting_item) {
            return;
        }

        setIsDeleting(true);
        router.delete(route('items.destroy', deleting_item.id), {
            onSuccess: () => setDeletingItem(null),
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    const renderCardDetails = (item: Item) => {
        if (item.type === 'vehicle') {
            return (
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2" title="Lehívó">
                            <KeyRound className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">
                                {item.details?.spawn_code || '-'}
                            </span>
                        </div>
                        <div
                            className="flex items-center gap-2"
                            title="Maximum sebesség"
                        >
                            <Gauge className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">
                                {item.details?.max_speed
                                    ? `${item.details.max_speed} km/h`
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 space-y-4">
                <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    title="Szezon"
                >
                    <SunSnow className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                        {item.details?.season || 'Nem megadott'}
                    </span>
                </div>
                {item.details?.roles && item.details.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-t pt-2">
                        {item.details.roles.map((role, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                            >
                                {role}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title={page_title} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {page_title}
                        </h1>
                        <Badge variant="outline" className="px-3 py-1 text-sm">
                            Összesen: {items?.length || 0} db
                        </Badge>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Új {is_vehicle ? 'Jármű' : 'Ruházat'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {current_items.map((item) => {
                        const can_open_modal = item.type === 'clothing';

                        return (
                            <Card
                                key={item.id}
                                className={`group overflow-hidden transition-all duration-200 ${can_open_modal ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''}`}
                                onClick={() =>
                                    can_open_modal && setSelectedItem(item)
                                }
                            >
                                <div
                                    className={`relative flex w-full items-center justify-center bg-muted/30 ${is_vehicle ? 'aspect-video h-56' : 'aspect-[3/4] h-[22rem]'}`}
                                >
                                    {/* Edit / Delete Akciók */}
                                    <div className="absolute top-2 left-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItem(item);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 bg-destructive/90 backdrop-blur-sm hover:bg-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(item);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {item.image ? (
                                        <img
                                            src={item.image.url}
                                            alt={item.name}
                                            className="h-full w-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            {is_vehicle ? (
                                                <Car className="h-16 w-16 text-muted-foreground/30" />
                                            ) : (
                                                <Shirt className="h-16 w-16 text-muted-foreground/30" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="line-clamp-1 text-lg font-bold">
                                        {item.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderCardDetails(item)}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {total_pages > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={current_page === 1}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Előző
                        </Button>
                        <div className="px-4 text-sm font-medium text-muted-foreground">
                            {current_page} / {total_pages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(total_pages, p + 1),
                                )
                            }
                            disabled={current_page === total_pages}
                        >
                            Következő
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Create/Edit Modal közös használata */}
                <CreateEditItemModal
                    isOpen={is_create_modal_open || !!editing_item}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingItem(null);
                    }}
                    type={type}
                    item={editing_item}
                />

                {/* Ruházat részletek modal */}
                <ClothingDetailsModal
                    isOpen={!!selected_item}
                    onClose={() => setSelectedItem(null)}
                    item={selected_item}
                />

                {/* Törlés megerősítése az ÚJ komponenssel */}
                <ConfirmDeleteDialog
                    isOpen={!!deleting_item}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={handleDelete}
                    isProcessing={is_deleting}
                    description={
                        <>
                            A(z) <strong>{deleting_item?.name}</strong> véglegesen törlésre kerül. Ezt a műveletet nem lehet visszavonni.
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
