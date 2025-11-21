<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Traits\Controller\ApiResponseTrait;

class AIController extends Controller
{
    use ApiResponseTrait;

    public function analyze(Request $request)
    {
        $this->validateRequest($request, [
            'report' => 'required|string|min:10',
            'images' => 'required|array|min:1',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:32768',
        ], [
            'report.required' => 'Deskripsi laporan wajib diisi.',
            'report.string' => 'Deskripsi laporan harus berupa teks.',
            'report.min' => 'Deskripsi laporan minimal harus 10 karakter.',
            'images.required' => 'Wajib melampirkan foto bukti laporan.',
            'images.array' => 'Format pengiriman gambar tidak valid.',
            'images.min' => 'Harap lampirkan minimal 1 foto bukti.',
            'images.*.image' => 'File yang diunggah harus berupa gambar.',
            'images.*.mimes' => 'Format gambar harus jpeg, png, atau jpg.',
            'images.*.max' => 'Ukuran setiap gambar tidak boleh lebih dari 2MB.',
        ]);

        $aiEndpoint = config('ai.endpoint');

        try {
            $httpClient = Http::asMultipart()->timeout(600);;

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $stream = fopen($image->getRealPath(), 'r');
                    
                    $httpClient->attach(
                        'images',
                        $stream,
                        $image->getClientOriginalName()
                    );
                }
            }

            $response = $httpClient->post($aiEndpoint, [
                'report' => $request->report
            ]);

            if ($response->failed()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Server AI Error: ' . $response->body()
                ], $response->status());
            }

            $responseData = $response->json();

            if (($responseData['status'] ?? '') !== 'success') {
                throw new \Exception($responseData['message'] ?? 'Unknown error from AI Server');
            }

            return response()->json([
                'status' => 'success',
                'data' => $responseData['data'],
                'meta' => $responseData['meta']
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses AI: ' . $e->getMessage()
            ], 500);
        }
    }
}