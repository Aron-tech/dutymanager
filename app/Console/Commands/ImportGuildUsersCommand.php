<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Console\Command\Command as CommandAlias;

class ImportGuildUsersCommand extends Command
{
    protected $signature = 'import:guild-users
                            {file : Az SQL fájl neve a projekt gyökerében (pl. guild_user.sql)}
                            {guild_id : A szűrendő Discord Guild ID}
                            {--import-details : Ha meg van adva, a Jelvényszám és Telefonszám átvitelre kerül a details JSONB mezőbe}';

    protected $description = 'MySQL dumpból adatok átvétele PostgreSQL-be egy adott guild_id alapján, javított rugalmas parszolással.';

    public function handle(): int
    {
        $file_name = $this->argument('file');
        $file_path = base_path($file_name);
        $target_guild_id = trim((string) $this->argument('guild_id'));
        $import_details = $this->option('import-details');

        if (! file_exists($file_path)) {
            $this->error("A fájl nem található a projekt könyvtárában: {$file_path}");

            return CommandAlias::FAILURE;
        }

        $this->info("Importálás indítása... Fájl: {$file_name} | Guild ID: {$target_guild_id}");

        $file_handle = fopen($file_path, 'r');
        $imported_count = 0;

        DB::beginTransaction();

        try {
            while (($line = fgets($file_handle)) !== false) {
                if (! str_starts_with(trim($line), 'INSERT INTO')) {
                    continue;
                }

                // Kinyerjük a VALUES utáni részeket
                if (preg_match('/VALUES\s+(.*);/i', trim($line), $values_match)) {
                    $values_block_str = $values_match[1];
                } else {
                    continue;
                }

                // Felosztjuk a rekordokat a zárójelek mentén
                preg_match_all('/\(.*?\)/', $values_block_str, $matches);

                if (empty($matches[0])) {
                    continue;
                }

                foreach ($matches[0] as $values_block) {
                    $cleaned_block = trim($values_block, '()');
                    $values = str_getcsv($cleaned_block, ',', "'");

                    if (count($values) < 6) {
                        continue;
                    }

                    // Biztonságos tisztítás (levágja az aposztrófokat és a felesleges szóközöket is)
                    $guild_guild_id = trim($values[1], "' ");

                    if ($guild_guild_id !== $target_guild_id) {
                        continue;
                    }

                    $id = trim($values[0], "' ");
                    $user_discord_id = trim($values[2], "' ");
                    $ic_name = trim($values[3], "' ");
                    $ic_number = trim($values[4], "' ");
                    $ic_tel = trim($values[5], "' ");

                    if ($ic_tel === 'NULL' || $ic_tel === '') {
                        $ic_tel = null;
                    }

                    $created_at = isset($values[9]) && trim($values[9], "' ") !== 'NULL' ? trim($values[9], "' ") : now();
                    $updated_at = isset($values[10]) && trim($values[10], "' ") !== 'NULL' ? trim($values[10], "' ") : now();

                    $current_time = now();

                    $insert_data = [
                        'id' => (int) $id,
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

            fclose($file_handle);

            $this->adjustPostgresSequence();

            DB::commit();
            $this->info("Sikeres futás! Beillesztve/Frissítve: {$imported_count} rekord.");

            return CommandAlias::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            fclose($file_handle);
            $this->error('Hiba: '.$e->getMessage());
            Log::error('Szkript hiba: '.$e->getMessage());

            return CommandAlias::FAILURE;
        }
    }

    private function adjustPostgresSequence(): void
    {
        $seq_sequence = DB::select("SELECT pg_get_serial_sequence('guild_users', 'id') as seq")[0]->seq;
        if ($seq_sequence) {
            DB::select("SELECT setval('{$seq_sequence}', COALESCE(MAX(id), 1)) FROM guild_users");
        }
    }
}
