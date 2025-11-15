<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class District extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'regency_id',
        'code',
        'name',
    ];

    /**
     * Mendefinisikan relasi: satu Kecamatan dimiliki oleh satu Kabupaten/Kota.
     */
    public function regency(): BelongsTo
    {
        return $this->belongsTo(Regency::class);
    }
}