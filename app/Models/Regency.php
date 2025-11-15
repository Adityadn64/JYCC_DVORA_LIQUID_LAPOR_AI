<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Regency extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'name',
    ];

    /**
     * Mendefinisikan relasi: satu Kabupaten/Kota memiliki banyak Kecamatan.
     */
    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }
}