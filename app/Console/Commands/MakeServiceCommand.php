<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MakeServiceCommand extends Command
{
    protected $signature = 'make:service {name}';

    protected $description = 'Create a new service class';

    public function handle(): void
    {
        $name = $this->argument('name');
        $directory = app_path('Services');
        $file_path = "{$directory}/{$name}.php";

        if (! File::exists($directory)) {
            File::makeDirectory($directory);
        }

        if (File::exists($file_path)) {
            $this->error("A(z) {$name} már létezik!");

            return;
        }

        $content = "<?php\n\nnamespace App\Services;\n\nclass {$name}\n{\n\n}\n";

        File::put($file_path, $content);
        $this->info("A(z) {$name} sikeresen létrejött a Services mappában.");
    }
}
