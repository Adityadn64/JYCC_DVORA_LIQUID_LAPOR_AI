<?php

namespace App\Http\Controllers;

use App\Traits\Controller\ApiResponseTrait;
use App\Traits\Middleware\CheckTheAdminTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    use ApiResponseTrait;
    use CheckTheAdminTrait;

    public function getFile(Request $theRequest)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($theRequest);

        $this->validateRequest($request, [
            'datapd' => [
                'required', 
                'string', 
                'min:3',
                'regex:/^(pu|pi)\/.+/i'
            ]
        ], [
            'datapd.required' => 'Kolom Path wajib diisi.',
            'datapd.string' => 'Kolom Path harus berupa teks (string).',
            'datapd.min' => 'Kolom Path minimal harus memiliki 3 karakter.',
            'datapd.regex' => 'Kolom Path harus diawali dengan "pu/" atau "pi/".',
        ]);

        $datapd = $request->datapd;
        $pathContent = substr($datapd, 3);
        $diskPrefix = substr($datapd, 0, 2);
        
        $diskName = $diskPrefix === 'pi' ? 'local' : 'public';
        
        if ($diskName === 'private') {
            $authCheck = $this->checkAdmin($theRequest, false, null);
            if ($authCheck instanceof JsonResponse) {
                return $authCheck;
            }
        }

        $isS3 = config('filesystems.default') === 's3';

        if ($isS3) {
            $publicUrl = base64_decode($pathContent, true);
            if ($publicUrl === false || !filter_var($publicUrl, FILTER_VALIDATE_URL)) {
                abort(400, 'Gagal memproses path file. Format tidak valid.');
            }

            $baseUrl = config('filesystems.disks.s3.endpoint');
            if (!$baseUrl) {
                abort(500, 'Konfigurasi AWS_ENDPOINT belum diatur di file .env.');
            }
            $relativePath = str_replace($baseUrl . '/', '', $publicUrl);

            $storageDisk = Storage::disk('s3');
            if (!$storageDisk->exists($relativePath)) {
                abort(404, 'File tidak ditemukan di S3.');
            }

            $fileContent = $storageDisk->get($relativePath);
            /** @disregard P1013 */
            $mimeType = $storageDisk->mimeType($relativePath);

            return new Response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Length' => strlen($fileContent)
            ]);

        } else {
            $storageDisk = Storage::disk($diskName);

            if (!$storageDisk->exists($pathContent)) {
                abort(404, 'File tidak ditemukan di penyimpanan lokal.');
            }

            /** @disregard P1013 */
            return $storageDisk->response($pathContent);
        }
    }
}