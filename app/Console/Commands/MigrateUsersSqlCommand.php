<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class MigrateUsersSqlCommand extends Command
{
    protected $signature = 'migrate:users-sql';

    protected $description = 'Migrate users from users.sql to PostgreSQL';

    public function handle()
    {
        $path = base_path('users.sql');

        if (! File::exists($path)) {
            $this->error("A users.sql nem található a projekt gyökerében: {$path}");

            return;
        }

        $this->info('users.sql beolvasása...');
        $content = File::get($path);

        // Kikeressük az összes INSERT INTO `users` kezdetű sort
        preg_match_all('/INSERT INTO `users` [^;]+;/i', $content, $matches);

        if (empty($matches[0])) {
            $this->error('Nem találhatók beszúrási parancsok a fájlban.');

            return;
        }

        $count = 0;
        $this->info('Adatok feldolgozása és mentése...');

        foreach ($matches[0] as $insert_statement) {
            // Kivágjuk az VALUES utáni részt: (...), (...), (...)
            if (preg_match("/VALUES\s*(.+);/is", $insert_statement, $values_match)) {
                $values_string = $values_match[1];

                // Felvágjuk a sorokat az '),(' mintázat mentén
                $rows = preg_split("/\s*\),\s*\(\s*/", trim($values_string, "() \r\n"));

                foreach ($rows as $row) {
                    // Az SQL-szerű string sorokat tömbbé alakítjuk
                    $clean_row = str_getcsv($row, ',', "'");

                    if (count($clean_row) < 9) {
                        continue;
                    }

                    // Értékek behelyettesítése a régi oszlopsorrend alapján
                    $discord_id = $clean_row[0];
                    $name = $clean_row[1];
                    $avatar = $clean_row[2] === 'NULL' ? null : $clean_row[2];
                    $email = $clean_row[3] === 'NULL' ? null : $clean_row[3];
                    $d_token = $clean_row[4] === 'NULL' ? null : $clean_row[4];
                    $d_refresh_token = $clean_row[5] === 'NULL' ? null : $clean_row[5];
                    $global_role = $clean_row[6] == '1' ? 'admin' : 'user';
                    $created_at = $clean_row[7] === 'NULL' ? now() : $clean_row[7];
                    $updated_at = $clean_row[8] === 'NULL' ? now() : $clean_row[8];

                    // Beszúrás a .env által mutatott PostgreSQL adatbázisba
                    DB::table('users')->updateOrInsert(
                        ['id' => $discord_id],
                        [
                            'name' => $name,
                            'email' => $email,
                            'avatar_url' => $avatar,
                            'global_role' => $global_role,
                            'access_token' => $d_token,
                            'refresh_token' => $d_refresh_token,
                            'created_at' => $created_at,
                            'updated_at' => $updated_at,
                        ]
                    );
                    $count++;
                }
            }
        }

        $this->info("Sikeresen átmásolva {$count} felhasználó a PostgreSQL adatbázisba!");
    }
}
