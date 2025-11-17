<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class LoginController extends Controller
{
    use ApiResponseTrait;

    public function login(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        Validator::make($request->all(), [
            'login_identifier' => 'required|string',
            'password' => 'required|string',
        ])->validate();

        // Access input using $request->input() or magic property
        $loginIdentifier = $request->input('login_identifier');
        $password = $request->input('password');

        $admin = Administrator::where('email', $loginIdentifier)
                                ->orWhere('phone', $loginIdentifier)
                                ->orWhere('nip', $loginIdentifier)
                                ->first();

        if (!$admin || !Hash::check($password, $admin->password_hash)) {
            return $this->errorResponse('Kredensial yang diberikan tidak cocok dengan data kami.', 400);
        }

        if ($admin->status === AdminStatusEnum::Pending) {
            return $this->errorResponse('Akun Anda sedang dalam proses peninjauan. Silakan coba lagi nanti.', 403);
        }

        if ($admin->status === AdminStatusEnum::Suspended) {
            return $this->errorResponse('Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.', 403);
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