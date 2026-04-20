import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SunSnow, Shirt } from 'lucide-react';
import { Item } from './index';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: Item | null;
}

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center py-2.5 border-b border-border/30 last:border-0 gap-1">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-foreground/90">{value || '-'}</span>
    </div>
);

export default function ClothingDetailsModal({ isOpen, onClose, item }: Props) {
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* FIGYELEM: A sm:max-w-[95vw] és lg:max-w-[1600px] kötelező a shadcn default felülírásához! */}
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[1400px] xl:max-w-[1600px] w-full h-[95vh] sm:h-[90vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row">

                {/* Bal oldal: Adatok */}
                <div className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 bg-background overflow-y-auto order-2 md:order-1">
                    <DialogHeader className="text-left space-y-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-3xl lg:text-5xl font-extrabold tracking-tight">{item.name}</DialogTitle>
                        </div>
                        <DialogDescription className="flex items-center gap-2 mt-2 text-base lg:text-lg">
                            <SunSnow className="w-5 h-5 text-primary" />
                            <span>Szezon: <strong>{item.details?.season || 'Nem megadott'}</strong></span>
                        </DialogDescription>
                    </DialogHeader>

                    {item.details?.roles && item.details.roles.length > 0 && (
                        <div className="space-y-3 pb-6 border-b border-border/50">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Elérhető rangok</p>
                            <div className="flex flex-wrap gap-2.5">
                                {item.details.roles.map((role, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3.5 py-1.5 text-sm">{role}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 xl:gap-x-16 gap-y-2 bg-muted/10 p-6 lg:p-8 rounded-2xl border shadow-sm">
                        {/* 1. Oszlop */}
                        <div className="space-y-1.5">
                            <DetailRow label="Maszk" value={item.details?.mask} />
                            <DetailRow label="Kabátok" value={item.details?.jackets} />
                            <DetailRow label="Test páncél" value={item.details?.body_armor} />
                            <DetailRow label="Kezek" value={item.details?.hands} />
                            <DetailRow label="Matrica" value={item.details?.decals} />
                            <DetailRow label="Sapkák" value={item.details?.hats} />
                            <DetailRow label="Fül" value={item.details?.ears} />
                        </div>
                        {/* 2. Oszlop */}
                        <div className="space-y-1.5 lg:border-l border-border/50 lg:pl-8 xl:pl-16 border-t lg:border-t-0 pt-3 lg:pt-0 mt-3 lg:mt-0">
                            <DetailRow label="Sál és láncok" value={item.details?.scarves_chains} />
                            <DetailRow label="Poló" value={item.details?.shirts} />
                            <DetailRow label="Táskák" value={item.details?.bags} />
                            <DetailRow label="Nadrág" value={item.details?.pants} />
                            <DetailRow label="Cipők" value={item.details?.shoes} />
                            <DetailRow label="Szemüveg" value={item.details?.glasses} />
                            <DetailRow label="Órák" value={item.details?.watches} />
                        </div>
                    </div>
                </div>

                {/* Jobb oldal: Kép (Fix 50% szélesség nagy képernyőn) */}
                <div className="md:w-1/2 bg-muted/5 relative min-h-[400px] md:min-h-full border-b md:border-b-0 md:border-l border-border/50 order-1 md:order-2 flex items-center justify-center p-6 lg:p-12">
                    {item.image ? (
                        <img
                            src={item.image.url}
                            alt={item.name}
                            className="w-full h-full max-h-[85vh] object-contain drop-shadow-2xl"
                        />
                    ) : (
                        <Shirt className="w-40 h-40 text-muted-foreground/20" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
