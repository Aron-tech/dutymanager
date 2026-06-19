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

        preg_match_all('/INSERT INTO `users` [^;]+;/i', $content, $matches);

        if (empty($matches[0])) {
            $this->error('Nem találhatók beszúrási parancsok a fájlban.');

            return;
        }

        $count = 0;
        $this->info('Adatok feldolgozása és mentése...');

        foreach ($matches[0] as $insert_statement) {
            if (preg_match("/VALUES\s*(.+);/is", $insert_statement, $values_match)) {
                $values_string = $values_match[1];
                $rows = preg_split("/\s*\),\s*\(\s*/", trim($values_string, "() \r\n"));

                foreach ($rows as $row) {
                    $clean_row = str_getcsv($row, ',', "'");

                    // Minden mezőt megtisztítunk és ha 'NULL' szöveg vagy üres, akkor valódi PHP null értékké alakítjuk
                    $clean_row = array_map(function ($value) {
                        $trimmed = trim($value, " '\"");
                        if (strtoupper($trimmed) === 'NULL' || $trimmed === '') {
                            return null;
                        }

                        return $trimmed;
                    }, $clean_row);

                    if (count($clean_row) < 9 || empty($clean_row[0])) {
                        continue;
                    }

                    $discord_id = $clean_row[0];
                    $name = $clean_row[1] ?? 'Ismeretlen';
                    $avatar = $clean_row[2];
                    $email = $clean_row[3];
                    $d_token = $clean_row[4];
                    $d_refresh_token = $clean_row[5];
                    $global_role = ($clean_row[6] == '1') ? 'admin' : 'user';
                    $created_at = $clean_row[7] ?? now();
                    $updated_at = $clean_row[8] ?? now();

                    DB::table('users')->updateOrInsert(
                        ['id' => $discord_id],
                        [
                            'name' => $name,
                            'email' => $email, // Itt már valódi NULL megy át, ha nincs érték
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
