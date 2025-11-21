<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Enums\AdminStatusEnum;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    use ApiResponseTrait;

    public function login(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'login_identifier' => 'required|string',
            'password' => 'required|string',
        ], [
            'login_identifier.required' => 'Email, NIP, atau nomor telepon wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        // Access input using $request->input() or magic property
        $loginIdentifier = $request->input('login_identifier');
        $password = $request->input('password');

        $admin = Administrator::where('email', $loginIdentifier)
                                ->orWhere('phone', $loginIdentifier)
                                ->orWhere('nip', $loginIdentifier)
                                ->first();

        if (!$admin) {
            return $this->errorResponse('Akun tidak ditemukan.', 400);
        }

        if (!Hash::check($password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        if ($admin->status === AdminStatusEnum::Pending) {
            return $this->errorResponse('Akun Anda sedang dalam proses peninjauan. Silakan coba lagi nanti.', 401);
        }

        if ($admin->status === AdminStatusEnum::Suspended) {
            return $this->errorResponse('Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.', 401);
        }

        $admin->tokens()->delete();
        $token = $admin->createToken('admin-token', ['role:' . $admin->role->value])->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'role' => $admin->role->value,
                'profile_picture_path' => $admin->profile_picture_path,
            ]
        ], 'Login berhasil.');
    }

    public function logout(Request $request)
    {
        $request = $this->decodeRequest($request);
        
        return $this->successResponse([], 'Logout berhasil.');
    }
}