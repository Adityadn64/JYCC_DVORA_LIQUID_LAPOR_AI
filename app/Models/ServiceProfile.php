<?php

namespace App\Models;

use App\Enums\ServiceCodeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'service_profiles';

    protected $fillable = ['full_name', 'code', 'phone', 'email', 'website'];

    protected $casts = [
        'id'   => 'integer',
        'code' => ServiceCodeEnum::class,
    ];

    public function administrators(): HasMany
    {
        return $this->hasMany(Administrator::class, 'service_code', 'code');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'service_id');
    }
}