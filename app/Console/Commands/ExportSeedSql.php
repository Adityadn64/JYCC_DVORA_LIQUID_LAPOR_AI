<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Database\Events\QueryExecuted;

class ExportSeedSql extends Command
{
    protected $signature = 'db:seed-to-sql {--file=SEEDERS.sql : The output SQL file name}';
    protected $description = 'Runs seeders and exports executed INSERT queries to an SQL file.';

    public function handle()
    {
        $outputFile = base_path('database/' . $this->option('file'));

        // Pastikan file output kosong sebelum memulai
        File::put($outputFile, '');

        DB::listen(function (QueryExecuted $query) use ($outputFile) {
            // 1. Hanya tangkap query INSERT
            if (!str_starts_with(strtolower($query->sql), 'insert')) {
                return;
            }

            $sql = $query->sql;
            
            // 2. Ganti placeholder dengan nilai yang diformat dengan benar
            foreach ($query->bindings as $binding) {
                $sql = preg_replace('/\?/', $this->getFormattedValue($binding), $sql, 1);
            }

            File::append($outputFile, $sql . ";\n");
        });

        $this->info("Starting seeder and listening for queries...");

        try {
            $this->call('db:seed');
            $this->info("Seeders executed successfully.");
        } catch (\Exception $e) {
            $this->error("An error occurred during seeding: " . $e->getMessage());
            $this->warn("The generated SQL file might be incomplete.");
            return 1; // Keluar dengan kode error
        } finally {
            // Menghentikan listener tidak mudah, namun proses command akan berakhir di sini.
        }

        $this->info("Seed queries exported to: {$outputFile}");
        return 0;
    }

    protected function getFormattedValue($value): string
    {
        // 3. Logika untuk menangani tipe data yang berbeda
        if (is_null($value)) {
            return 'NULL';
        }

        if (is_numeric($value)) {
            return $value;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        
        // Untuk string dan tipe data lainnya, gunakan PDO quote untuk escaping yang aman
        return DB::connection()->getPdo()->quote($value);
    }
}