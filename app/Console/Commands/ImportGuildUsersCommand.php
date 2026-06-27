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

    protected $description = 'MySQL dumpból adatok átvétele PostgreSQL-be egy adott guild_id alapján, fixált regex parszolással.';

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

                // Kivonjuk az összes ( ... ) rekordot a sorból, figyelembe véve az idézőjeleket is
                preg_match_all('/\((\d+),\s*\'?(\d+)\'?,\s*(.*?)\)/s', $line, $matches);

                if (empty($matches[0])) {
                    // Ha nem illeszkedett az előző, egy lazább zárójeles illesztést futtatunk
                    preg_match_all('/\(([^)]+)\)/', $line, $matches);
                }

                foreach ($matches[0] as $values_block) {
                    $cleaned_block = trim($values_block, '()');

                    // Kézi darabolás a sima CSV helyett, hogy a fixen string/szám mezők ne essenek szét
                    $parts = explode(',', $cleaned_block);
                    if (count($parts) < 6) {
                        continue;
                    }

                    // Mezők kinyerése és tisztítása a felesleges karakterektől
                    $id = trim($parts[0], "' ");
                    $guild_guild_id = trim($parts[1], "' ");
                    $user_discord_id = trim($parts[2], "' ");
                    $ic_name = trim($parts[3], "' ");
                    $ic_number = trim($parts[4], "' ");
                    $ic_tel = trim($parts[5], "' ");

                    if ($guild_guild_id !== $target_guild_id) {
                        continue;
                    }

                    if ($ic_tel === 'NULL' || $ic_tel === '') {
                        $ic_tel = null;
                    }

                    // Időbélyegek kinyerése a tömb végéről biztonságosan
                    $created_at = isset($parts[9]) && trim($parts[9], "' ") !== 'NULL' ? trim($parts[9], "' ") : now();
                    $updated_at = isset($parts[10]) && trim($parts[10], "' ") !== 'NULL' ? trim($parts[10], "' ") : now();

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

            return Command::SUCCESS;

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
