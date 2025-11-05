<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportMedia extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $fillable = ['report_id', 'files_path', 'files_type', 'caption', 'created_at'];

    protected $casts = [
        'files_path' => 'array',
        'files_type' => 'array',
        'created_at' => 'datetime',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_id');
    }
}