<?php

namespace App\Http\Controllers\Data;

use App\Http\Controllers\Controller;
use App\Models\Regency;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RegionController extends Controller
{
    use ApiResponseTrait;

    public function getFormattedRegions(Request $request)
    {
        try {
            $regencies = Regency::with([
                // Kita juga bisa mengurutkan kecamatan di level relasi
                'districts' => function ($query) {
                    $query->select('id', 'regency_id', 'code', 'name')->orderBy('name', 'asc');
                }
            ])
            ->select('id', 'code', 'name') // Hanya ambil kolom yang dibutuhkan dari regencies
            ->orderBy('name', 'asc')
            ->get();

            $formattedData = $regencies->map(function ($regency) {
                return [
                    'code' => $regency->code,
                    'name' => $regency->name,
                    'districts' => $regency->districts->map(function ($district) {
                        return [
                            'code' => $district->code,
                            'name' => $district->name,
                        ];
                    }),
                ];
            });

            return $this->successResponse($formattedData);
        } catch (\Exception $e) {
            Log::error('Gagal mengambil data wilayah terformat: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan pada server saat mengambil data wilayah.', 500);
        }
    }
}