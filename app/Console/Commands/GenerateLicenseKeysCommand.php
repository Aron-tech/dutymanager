<?php

namespace App\Console\Commands;

use App\Models\LicenseKey;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateLicenseKeysCommand extends Command
{
    /**
     * php artisan license:generate monthly 10
     */
    protected $signature = 'license:generate
                            {plan_type : The license type (monthly, yearly, lifetime)}
                            {count=1 : Number of keys to generate}';

    protected $description = 'Generate license keys';

    public function handle(): int
    {
        $planType = $this->argument('plan_type');
        $count = (int) $this->argument('count');

        if ($count < 1) {
            $this->error('Count must be at least 1.');

            return self::FAILURE;
        }

        $keys = [];

        for ($i = 0; $i < $count; $i++) {
            $key = $this->generateUniqueKey();

            LicenseKey::create([
                'key' => $key,
                'plan_type' => $planType,
            ]);

            $keys[] = $key;
        }

        $this->info("Generated {$count} license key(s):");
        $this->newLine();

        foreach ($keys as $key) {
            $this->line($key);
        }

        return self::SUCCESS;
    }

    protected function generateUniqueKey(): string
    {
        do {
            $key = strtoupper(
                Str::random(5).'-'.
                Str::random(5).'-'.
                Str::random(5).'-'.
                Str::random(5)
            );
        } while (LicenseKey::where('key', $key)->exists());

        return $key;
    }
}
