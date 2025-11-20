<?php

namespace App\Http\Controllers;

use App\Traits\Controller\ApiResponseTrait;
use App\Traits\Middleware\CheckTheAdminTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    use ApiResponseTrait;
    use CheckTheAdminTrait;

    public function getFile(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'datapd' => [
                'required', 
                'string', 
                'min:2', 
                'regex:/^(pu|pi).*/i'
            ]
        ], [
            'datapd.required' => 'Kolom Path wajib diisi.',
            'datapd.string' => 'Kolom Path harus berupa teks (string).',
            'datapd.min' => 'Kolom Path minimal harus memiliki 2 karakter.',
            'datapd.regex' => 'Kolom Path harus diawali dengan "pu" atau "pi".',
        ]);

        $datapd = $request->datapd;
        $path = substr($datapd, 2);
        $disk = substr($datapd, 0, 2) === "pu" ? "public" : "private";

        if ($disk === "private") {
            $this->checkAdmin($request, false, null);
        }

        /**
         * @var \Illuminate\Contracts\Filesystem\Filesystem $storageDisk
         * @mixin \Illuminate\Support\Facades\Storage
         */
        $storageDisk = Storage::disk($disk);
        $file = $storageDisk->get($path);

        if (!$file) {
            abort(404, 'File tidak ditemukan.');
        }

        /** @disregard P1013 */
        return $storageDisk->response($path);
    }
}