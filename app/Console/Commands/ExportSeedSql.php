<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ExportSeedSql extends Command
{
    protected $signature = 'db:seed-to-sql {--file=seed_export.sql : The output SQL file name}';
    protected $description = 'Runs seeders and exports executed queries to an SQL file.';

    public function handle()
    {
        $outputFile = base_path('database/' . $this->option('file'));
        File::put($outputFile, '');

        DB::listen(function ($query) use ($outputFile) {
            $sql = $query->sql;
            $bindings = $query->bindings;

            // Replace placeholders with actual values
            foreach ($bindings as $binding) {
                $sql = preg_replace('/\?/', "'" . addslashes($binding) . "'", $sql, 1);
            }

            File::append($outputFile, $sql . ";\n");
        });

        $this->call('db:seed');

        $this->info("Seed queries exported to: {$outputFile}");
    }
}