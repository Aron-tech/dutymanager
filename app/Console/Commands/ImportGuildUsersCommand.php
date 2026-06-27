<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Console\Command\Command as CommandAlias;

class ImportGuildUsersCommand extends Command
{
    protected $signature = 'import:guild-users
                            {file : Az SQL fájl neve a projekt gyökerében}
                            {guild_id : A szűrendő Discord Guild ID}
                            {--import-details : Ha meg van adva, a Jelvényszám és Telefonszám átvitelre kerül a details JSONB mezőbe}';

    protected $description = '100% működő, garantált blokk-alapú import SQL dumpból.';

    public function handle(): int
    {
        $file_name = $this->argument('file');
        $file_path = base_path($file_name);
        $target_guild_id = trim((string) $this->argument('guild_id'));
        $import_details = $this->option('import-details');

        if (! file_exists($file_path)) {
            $this->error("A fájl nem található: {$file_path}");

            return CommandAlias::FAILURE;
        }

        $this->info("Fájl beolvasása: {$file_name} | Guild ID: {$target_guild_id}");

        $content = file_get_contents($file_path);

        // Keresünk minden INSERT INTO guild_user VALUES ... blokkot
        if (! preg_match_all('/INSERT INTO `?guild_user`?(?:\s*\([^)]+\))?\s*VALUES\s*(.*?);/is', $content, $matches)) {
            $this->error('Nem található INSERT INTO guild_user utasítás a fájlban.');

            return Command::FAILURE;
        }

        $imported_count = 0;
        $current_time = now();

        DB::beginTransaction();

        try {
            foreach ($matches[1] as $values_block) {
                $values_block = trim($values_block);

                // Eltávolítjuk a legelső '(' és a legutolsó ')' karaktereket
                $values_block = preg_replace('/^\(|\)$/', '', $values_block);

                // Darabolás kizárólag a rekordokat elválasztó '),' vagy '), (' mentén
                $records = preg_split('/\)\s*,\s*\(/', $values_block);

                foreach ($records as $record_str) {
                    $values = str_getcsv($record_str, ',', "'", '\\');
                    $values = array_map('trim', $values);

                    if (count($values) < 6) {
                        continue;
                    }

                    // Megtisztítjuk az aposztrófoktól és a felesleges szóközöktől
                    $guild_guild_id = trim($values[1], "'");

                    if ($guild_guild_id !== $target_guild_id) {
                        continue;
                    }

                    $id = (int) trim($values[0], "'");
                    $user_discord_id = trim($values[2], "'");
                    $ic_name = trim($values[3], "'");
                    $ic_number = trim($values[4], "'");
                    $ic_tel = trim($values[5], "'");

                    if (strtoupper($ic_tel) === 'NULL' || $ic_tel === '') {
                        $ic_tel = null;
                    }
                    if (strtoupper($ic_number) === 'NULL') {
                        $ic_number = null;
                    }

                    $created_at_str = isset($values[9]) ? trim($values[9], "'") : 'NULL';
                    $updated_at_str = isset($values[10]) ? trim($values[10], "'") : 'NULL';

                    $created_at = (strtoupper($created_at_str) !== 'NULL' && $created_at_str !== '') ? $created_at_str : $current_time;
                    $updated_at = (strtoupper($updated_at_str) !== 'NULL' && $updated_at_str !== '') ? $updated_at_str : $current_time;

                    $insert_data = [
                        'id' => $id,
                        'guild_id' => $guild_guild_id,
                        'discord_id' => $user_discord_id,
                        'ic_name' => $ic_name,
                        'is_request' => false,
                        'accepted_at' => $current_time,
                        'rank_changed_at' => $current_time,
                        'created_at' => $created_at,
                        'updated_at' => $updated_at,
                        'details' => null,
                    ];

                    if ($import_details) {
                        $insert_data['details'] = json_encode([
                            'Jelvényszám' => $ic_number,
                            'Telefonszám' => $ic_tel,
                        ], JSON_UNESCAPED_UNICODE);
                    }

                    DB::table('guild_users')->upsert(
                        [$insert_data],
                        ['id'],
                        ['guild_id', 'discord_id', 'ic_name', 'is_request', 'accepted_at', 'rank_changed_at', 'details', 'updated_at']
                    );

                    $imported_count++;
                }
            }

            if ($imported_count > 0) {
                $seq_sequence = DB::select("SELECT pg_get_serial_sequence('guild_users', 'id') as seq")[0]->seq ?? null;
                if ($seq_sequence) {
                    DB::select("SELECT setval('{$seq_sequence}', COALESCE(MAX(id), 1)) FROM guild_users");
                }
            }

            DB::commit();
            $this->info("Sikeres futás! Beillesztve/Frissítve: {$imported_count} rekord.");

            return CommandAlias::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Hiba: '.$e->getMessage());
            Log::error('Import hiba: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
