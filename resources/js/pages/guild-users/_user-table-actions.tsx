import {
    MoreVertical,
    Edit,
    Clock,
    ImageIcon,
    Trash2,
    Shield,
    CalendarOff,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GuildUser } from '@/types';

interface UserTableActionsProps {
    user: GuildUser;
    onEdit: (user: GuildUser) => void;
    onShowDuties: (user: GuildUser) => void;
    onShowHolidays: (user: GuildUser) => void;
    onShowGallery: (user: GuildUser) => void;
    onShowPunishments: (user: GuildUser) => void;
    onDelete: (user: GuildUser) => void;
}

export default function UserTableActions({
    user,
    onEdit,
    onShowDuties,
    onShowHolidays,
    onShowPunishments,
    onShowGallery,
    onDelete,
}: UserTableActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Edit className="mr-2 h-4 w-4" /> Szerkesztés
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onShowDuties(user)}>
                    <Clock className="mr-2 h-4 w-4" /> Szolgálati idő
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onShowPunishments(user)}>
                    <Shield className="mr-2 h-4 w-4" /> Büntetések kezelése
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onShowHolidays(user)}>
                    <CalendarOff className="mr-2 h-4 w-4" /> Szabadság előzmények
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onShowGallery(user)}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Képek
                    {(user as any).images?.length > 0 && (
                        <Badge className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0">
                            {(user as any).images.length}
                        </Badge>
                    )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(user)}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Törlés
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
