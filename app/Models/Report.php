<?php

namespace App\Models;

use App\Enums\PriorityEnum;
use App\Enums\ReportCategoryEnum;
use App\Enums\ServiceCodeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reports';

    protected $fillable = [
        'assignee_admin_id', 'service_id', 'service_code', 'reporter_name', 
        'reporter_contact', 'title', 'description', 'address', 'city', 
        'district', 'category', 'priority', 'statuses', 
        'review_timestamps', 'reviewing_admin_ids', 'review_notes', 
        'agreements_history', 'disagreements_history'
    ];

    protected $casts = [
        'service_code' => ServiceCodeEnum::class,
        'category' => ReportCategoryEnum::class,
        'priority' => PriorityEnum::class,
        'statuses' => 'array',
        'review_timestamps' => 'array',
        'reviewing_admin_ids' => 'array',
        'review_notes' => 'array',
        'agreements_history' => 'array',
        'disagreements_history' => 'array',
    ];

    public function serviceProfile(): BelongsTo
    {
        return $this->belongsTo(ServiceProfile::class, 'service_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Administrator::class, 'assignee_admin_id');
    }

    public function media(): HasOne
    {
        return $this->hasOne(ReportMedia::class, 'report_id');
    }
}