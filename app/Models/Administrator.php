<?php

namespace App\Models;

use App\Enums\AdminStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Enums\ServiceCodeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Administrator extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'service_code', 'nip', 'full_name', 'email', 'phone', 
        'password_hash', 'profile_picture_path', 'kta_scan_path', 
        'role', 'status'
    ];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'service_code' => ServiceCodeEnum::class,
        'role' => RoleAdministratorEnum::class,
        'status' => AdminStatusEnum::class,
        'password_hash' => 'hashed',
    ];

    public function serviceProfile(): BelongsTo
    {
        return $this->belongsTo(ServiceProfile::class, 'service_code', 'code');
    }

    public function assignedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'assignee_admin_id');
    }
}