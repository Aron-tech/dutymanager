import { Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserDetailsProps {
    data: Record<string, { type: string; required: boolean }>;
    onChange: (field: string, value: any) => void;
}

export default function UserDetails({ data, onChange }: UserDetailsProps) {
    // ESLINT FIX: Lazy initialization - A kezdőértéket azonnal a data-ból építjük fel
    // Ez a nyílfüggvény csak a legelső betöltéskor (mount) fut le.
    const [fields, setFields] = useState<
        { id: string; name: string; type: string; required: boolean }[]
    >(() => {
        if (!data) {
            return [];
        }

        return Object.entries(data).map(([key, config]) => ({
            id: key,
            name: key,
            type: config.type,
            required: config.required,
        }));
    });

    // Új mező felvételéhez használt űrlap state-je
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('string');
    const [newRequired, setNewRequired] = useState(false);

    // Szinkronizálás a parent form objektumával
    const syncData = (currentFields: typeof fields) => {
        const configObject = currentFields.reduce(
            (acc, field) => {
                acc[field.name] = {
                    type: field.type,
                    required: field.required,
                };

                return acc;
            },
            {} as Record<string, any>,
        );

        onChange('config', configObject);
    };

    const handleAdd = () => {
        if (!newName.trim() || fields.some((f) => f.name === newName.trim())) {
            return;
        }

        const updatedFields = [
            ...fields,
            {
                id: newName.trim(),
                name: newName.trim(),
                type: newType,
                required: newRequired,
            },
        ];
        setFields(updatedFields);
        syncData(updatedFields);

        // Reset
        setNewName('');
        setNewType('string');
        setNewRequired(false);
    };

    const handleRemove = (idToRemove: string) => {
        const updatedFields = fields.filter((f) => f.id !== idToRemove);
        setFields(updatedFields);
        syncData(updatedFields);
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-base font-semibold text-foreground">
                    Extra Tag Adatok Kérése
                </h4>
                <p className="mb-4 text-sm text-muted-foreground">
                    Állítsd be, milyen egyedi adatokat kérjen a bot a
                    szervertagoktól a jelentkezés/profilozás során.
                    <br />
                    <span className="font-medium text-destructive">
                        Figyelem:
                    </span>{' '}
                    Egy mező törlésével az eddig felvett összes tagtól is
                    törlődik az adott adat!
                </p>
            </div>

            {/* Hozzáadó sáv */}
            <div className="flex flex-col items-end gap-4 rounded-xl border border-dashed border-primary/50 bg-accent/30 p-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                    <Label>Mező neve (pl. Játékon belüli név)</Label>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Név..."
                    />
                </div>

                <div className="w-full space-y-2 sm:w-40">
                    <Label>Típus</Label>
                    <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">
                                Szöveg (String)
                            </SelectItem>
                            <SelectItem value="int">
                                Egész szám (Int)
                            </SelectItem>
                            <SelectItem value="float">
                                Tört szám (Float)
                            </SelectItem>
                            <SelectItem value="bool">
                                Igen/Nem (Bool)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 space-y-2 pb-2">
                    <Checkbox
                        id="req"
                        checked={newRequired}
                        onCheckedChange={(val) =>
                            setNewRequired(val as boolean)
                        }
                    />
                    <Label htmlFor="req" className="mb-0 cursor-pointer">
                        Kötelező?
                    </Label>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                >
                    <Plus className="mr-1 h-5 w-5" /> Hozzáadás
                </Button>
            </div>

            {/* Jelenlegi mezők listája */}
            <div className="mt-6 space-y-3">
                {fields.length === 0 ? (
                    <div className="rounded-xl border bg-card py-6 text-center text-sm text-muted-foreground">
                        Nincsenek extra mezők beállítva.
                    </div>
                ) : (
                    fields.map((field) => (
                        <div
                            key={field.id}
                            className="flex items-center justify-between rounded-xl border bg-card/50 p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <span className="font-semibold">
                                    {field.name}
                                </span>
                                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold tracking-wider text-primary uppercase">
                                    {field.type}
                                </span>
                                {field.required && (
                                    <span className="flex items-center gap-1 text-xs text-destructive">
                                        <span className="h-2 w-2 rounded-full bg-destructive"></span>{' '}
                                        Kötelező
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(field.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
