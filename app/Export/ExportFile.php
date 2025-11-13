<?php

namespace App\Export;

use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromIterator;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportFile
{
    public static function exportCSV(iterable $data, array $columns, string $filename = 'export.csv'): StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($data, $columns) {
            if (ob_get_level()) ob_end_clean();

            set_time_limit(0);

            $file = fopen('php://output', 'w');

            fputcsv($file, array_keys($columns));

            foreach ($data as $row) {
                $rowData = [];
                foreach ($columns as $header => $valueExtractor) {
                    if (is_callable($valueExtractor)) {
                        $rowData[] = $valueExtractor($row);
                    } else {
                        $rowData[] = data_get($row, $valueExtractor);
                    }
                }
                fputcsv($file, $rowData);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }
    
    public static function exportExcel(iterable $data, array $columns, string $filename = 'export.xlsx'): BinaryFileResponse
    {
        $exportable = new class($data, $columns) implements FromIterator, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
        {
            private iterable $data;
            private array $columns;
            private array $columnHeaders;

            public function __construct(iterable $data, array $columns)
            {
                $this->data = $data;
                $this->columns = $columns;
                $this->columnHeaders = array_keys($columns);
            }

            public function iterator(): \Iterator
            {
                return new \IteratorIterator(is_array($this->data) ? new \ArrayIterator($this->data) : $this->data);
            }

            public function headings(): array
            {
                return $this->columnHeaders;
            }

            public function map($row): array
            {
                $rowData = [];
                foreach ($this->columns as $header => $valueExtractor) {
                    if (is_callable($valueExtractor)) {
                        $rowData[] = $valueExtractor($row);
                    } else {
                        $rowData[] = data_get($row, $valueExtractor);
                    }
                }
                return $rowData;
            }

            public function styles(Worksheet $sheet)
            {
                return [
                    1    => ['font' => ['bold' => true]],
                ];
            }
        };

        return Excel::download($exportable, $filename);
    }
}