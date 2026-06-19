<?php

return [
    'meta' => [
        'title' => 'Dokumentáció – DutyManager v3',
    ],
    'header' => [
        'eyebrow' => 'Dokumentáció',
        'title' => 'DutyManager v3',
        'subtitle_part_1' => 'A teljes parancsreferencia és beállítási útmutató. Nyomja meg a',
        'subtitle_part_2' => '(vagy',
        'subtitle_part_3' => ') gombot a kereséshez.',
    ],
    'search' => [
        'button' => 'Keresés',
        'placeholder' => 'Keresés a dokumentációban és a parancsokban...',
        'no_results' => 'Nincs találat.',
        'pages' => 'Oldalak',
        'commands' => 'Parancsok',
    ],
    'table' => [
        'option' => 'Opció',
        'type' => 'Típus',
        'required' => 'Kötelező',
        'description' => 'Leírás',
        'required_yes' => 'Kötelező',
        'required_no' => 'Opcionális',
    ],
    'toc' => [
        'title' => 'Ezen az oldalon',
    ],
    'sections' => [
        [
            'id' => 'introduction',
            'title' => 'Bevezetés',
            'group' => 'Első Lépések',
            'summary' => 'Mi az a DutyManager v3, és milyen problémákat old meg a személyzettel rendelkező Discord közösségek számára.',
            'paragraphs' => [
                'A DutyManager v3 egy Discord kezelő bot, amely olyan komoly közösségek számára készült, amelyek személyzeti csapatokat, roleplay frakciókat és szervezett szervereket üzemeltetnek. Követi a szolgálati időt, kezeli a tagok nyilvántartását, strukturált büntetéseket oszt ki és kezeli a személyzet szabadságait – mindezt natív slash parancsokkal.',
                'Minden funkciót Discord slash parancsok vezérelnek, és szinkronizálva vannak egy webes irányítópulttal, így az adminisztrátorok mind a Discordon belül, mind a böngészőből áttekinthetik az adatokat.',
                'Ez a dokumentáció az élő parancssémából generálódik. Az alábbi parancsok mindegyike felsorolja a pontos opcióit, típusait, és azt, hogy kötelezőek-e.',
            ],
        ],
        [
            'id' => 'installation',
            'title' => 'Telepítés',
            'group' => 'Első Lépések',
            'summary' => 'Hívd meg a botot, és futtasd a kezdeti beállítási parancsot a szervereden.',
            'paragraphs' => [
                'Hívd meg a DutyManager v3-at a „Hozzáadás a Discordhoz” gombbal, majd add meg neki a kért szerepkör-jogosultságokat, hogy kezelni tudja a tagokat és beágyazásokat küldhessen.',
                'Miután a bot csatlakozott, futtasd a setup parancsot, hogy regisztráld a botot a szervereden, és inicializáld a konfigurációját.',
            ],
            'commands' => [
                [
                    'signature' => '/install',
                    'description' => 'Telepíti és inicializálja a DutyManager v3-at a jelenlegi szerveren. Futtasd ezt egyszer a bot meghívása után.',
                ],
                [
                    'signature' => '/info',
                    'description' => 'Általános információkat jelenít meg a botról és a szerver jelenlegi konfigurációjáról.',
                ],
            ],
        ],
        [
            'id' => 'user-management',
            'title' => 'Tagkezelés',
            'group' => 'Parancsok',
            'summary' => 'A bot által követett tagnyilvántartások megtekintése, szinkronizálása és törlése.',
            'paragraphs' => [
                'A /user parancscsoport a DutyManager által a szervereden nyilvántartott tagi adatokat kezeli. Használd egy tag keresésére, adatainak újraszinkronizálására vagy teljes eltávolítására.',
            ],
            'commands' => [
                [
                    'signature' => '/user info',
                    'description' => 'Megmutatja a tag tárolt adatait, beleértve a rangokat, szolgálati összesítéseket és büntetéseket.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => false, 'description' => 'A keresendő tag.'],
                        ['name' => 'discord_id', 'type' => 'String', 'required' => false, 'description' => 'Keresés nyers Discord ID alapján az említés helyett.'],
                    ],
                ],
                [
                    'signature' => '/user sync',
                    'description' => 'Újraszinkronizálja a tagok adatait a Discord és a DutyManager között.',
                ],
                [
                    'signature' => '/user delete',
                    'description' => 'Véglegesen töröl egy tagi adatot a DutyManagerből.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => false, 'description' => 'A törlendő tag.'],
                        ['name' => 'discord_id', 'type' => 'String', 'required' => false, 'description' => 'Törlés nyers Discord ID alapján.'],
                        ['name' => 'kick', 'type' => 'Boolean', 'required' => false, 'description' => 'A tag kirúgása a Discord szerverről is.'],
                    ],
                ],
            ],
        ],
        [
            'id' => 'duty-system',
            'title' => 'Szolgálati rendszer',
            'group' => 'Parancsok',
            'summary' => 'Kövesd a szolgálati időt, kezeld az összesítéseket és tekintsd meg a ranglistákat.',
            'paragraphs' => [
                'A /duty parancscsoport a DutyManager magja. A tagok be- és kikapcsolhatják a szolgálati állapotukat, míg a vezetőség módosíthatja az összesítéseket, megtekintheti a ranglistákat és visszaállíthatja az időszakokat.',
            ],
            'commands' => [
                ['signature' => '/duty toggle', 'description' => 'Be- vagy kikapcsolja a saját szolgálati állapotodat.'],
                ['signature' => '/duty cancel', 'description' => 'Megszakítja a jelenleg aktív szolgálati munkamenetedet.'],
                [
                    'signature' => '/duty fcancel',
                    'description' => 'Kényszerítetten megszakítja egy másik tag aktív szolgálati munkamenetét.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A tag, akinek a szolgálati munkamenetét meg kell szakítani.']],
                ],
                [
                    'signature' => '/duty toplist',
                    'description' => 'Megjelenít egy ranglistát a tagokról a felhalmozott szolgálati idő alapján.',
                    'options' => [
                        ['name' => 'limit', 'type' => 'Integer (1–100)', 'required' => false, 'description' => 'Hány tagot mutasson.'],
                        ['name' => 'show', 'type' => 'Boolean', 'required' => false, 'description' => 'Küldje el a ranglistát nyilvánosan a privát helyett.'],
                        ['name' => 'order_by', 'type' => 'String', 'required' => false, 'description' => 'Rendezés a jelenlegi időszak összesítése vagy a mindenkori időszak összesítése alapján.'],
                    ],
                ],
                [
                    'signature' => '/duty add',
                    'description' => 'Szolgálati perceket ad hozzá egy tag összesítéséhez.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A jóváírandó tag.'],
                        ['name' => 'minutes', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'A hozzáadandó percek száma.'],
                        ['name' => 'status', 'type' => 'Integer (0 = jelenlegi időszak, 1 = mindenkori időszak)', 'required' => false, 'description' => 'Melyik időszakra vonatkoznak a percek.'],
                    ],
                ],
                [
                    'signature' => '/duty remove',
                    'description' => 'Szolgálati perceket von le egy tag összesítéséből.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A tag, akitől le kell vonni.'],
                        ['name' => 'minutes', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'A levonandó percek száma.'],
                        ['name' => 'status', 'type' => 'Integer (0 = jelenlegi időszak, 1 = mindenkori időszak)', 'required' => false, 'description' => 'Melyik időszakra vonatkoznak a percek.'],
                    ],
                ],
                [
                    'signature' => '/duty delete',
                    'description' => 'Törli egy tag szolgálati adatait egy adott időszakra vonatkozóan.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A törlendő tag.'],
                        ['name' => 'status', 'type' => 'Integer (0 vagy 1)', 'required' => false, 'description' => 'Melyik időszakot törölje.'],
                    ],
                ],
                ['signature' => '/duty reset', 'description' => 'Visszaállítja a jelenlegi szolgálati időszakot a teljes szerverre vonatkozóan.'],
                ['signature' => '/duty clear', 'description' => 'Törli a szerver összes szolgálati adatát.'],
            ],
        ],
        [
            'id' => 'punishments',
            'title' => 'Büntetési rendszer',
            'group' => 'Parancsok',
            'summary' => 'Szóbeli figyelmeztetések, figyelmeztetések és feketelisták kiadása és visszavonása.',
            'paragraphs' => [
                'A /punishment parancscsoport többszintű fegyelmi folyamatot biztosít: szóbeli figyelmeztetéseket, hivatalos figyelmeztetéseket és feketelistákat, mindegyik opcionális lejárattal és súlyossági szintekkel.',
            ],
            'commands' => [
                [
                    'signature' => '/punishment verbal_warning',
                    'description' => 'Szóbeli figyelmeztetést ad ki egy tagnak.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A figyelmeztetendő tag.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'A figyelmeztetés oka.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'A napok száma a figyelmeztetés lejártáig.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'A figyelmeztetés súlyossági szintje.'],
                    ],
                ],
                [
                    'signature' => '/punishment warn',
                    'description' => 'Hivatalos figyelmeztetést ad ki egy tagnak.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A figyelmeztetendő tag.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'A figyelmeztetés oka.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'A napok száma a figyelmeztetés lejártáig.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Figyelmeztetési szint.'],
                    ],
                ],
                [
                    'signature' => '/punishment blacklist',
                    'description' => 'Feketelistára tesz egy tagot a szerver rendszereiből.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A feketelistára helyezendő tag.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'A feketelista oka.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'A napok száma a feketelista lejártáig.'],
                    ],
                ],
                [
                    'signature' => '/punishment removeverbal_warning',
                    'description' => 'Eltávolít egy szóbeli figyelmeztetést egy tagtól.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A frissítendő tag.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Az eltávolítandó figyelmeztetési szint.'],
                    ],
                ],
                [
                    'signature' => '/punishment removewarn',
                    'description' => 'Eltávolít egy hivatalos figyelmeztetést egy tagtól.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A frissítendő tag.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Az eltávolítandó figyelmeztetési szint.'],
                    ],
                ],
                [
                    'signature' => '/punishment removeblacklist',
                    'description' => 'Eltávolít egy feketelistát egy tagtól.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A tag, akit le kell venni a feketelistáról.']],
                ],
            ],
        ],
        [
            'id' => 'holidays',
            'title' => 'Szabadság rendszer',
            'group' => 'Parancsok',
            'summary' => 'Engedd meg a személyzetnek a jóváhagyott szabadságok regisztrálását, és kezeld az aktív szabadságokat.',
            'paragraphs' => [
                'A /holiday parancscsoport lehetővé teszi a tagok számára a jóváhagyott szabadidő regisztrálását, így automatikusan kizárásra kerülnek az aktivitási követelményekből, a vezetőség pedig szükség esetén törölheti a szabadságokat.',
            ],
            'commands' => [
                [
                    'signature' => '/holiday start',
                    'description' => 'Szabadságot indít el a parancsot futtató tag számára.',
                    'options' => [
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'Hány napig tart a szabadság.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'A szabadság oka.'],
                        ['name' => 'delay_days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'A szabadság kezdete előtti késleltetés napokban.'],
                    ],
                ],
                ['signature' => '/holiday cancel', 'description' => 'Törli a saját aktív szabadságodat.'],
                [
                    'signature' => '/holiday fcancel',
                    'description' => 'Kényszerítetten törli egy másik tag aktív szabadságát.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'A tag, akinek a szabadságát meg kell szakítani.']],
                ],
            ],
        ],
    ],
];
