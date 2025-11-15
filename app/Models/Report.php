<?php

namespace App\Models;

// Import yang ditambahkan/diperlukan
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Cache; // <-- PENTING

// Import yang sudah ada
use App\Enums\DistrictEnum;
use App\Enums\PriorityEnum;
use App\Enums\RegencyEnum;
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

    // ... (properti $table, $fillable, $casts tidak berubah) ...
    protected $table = 'reports';

    protected $fillable = [
        'assignee_admin_id', 'service_id', 'service_code', 'reporter_name', 
        'reporter_contact', 'title', 'description', 'address', 'city', 
        'district', 'category', 'priority', 'statuses', 
        'review_timestamps', 'reviewing_admin_ids', 'review_notes', 
        'agreements_history', 'disagreements_history'
    ];

    protected $casts = [
        'city' => RegencyEnum::class,
        'district' => DistrictEnum::class,
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

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['city_name', 'district_name'];

    protected function cityName(): Attribute
    {
        return Attribute::make(
            get: function () {
                // Pastikan 'city' adalah Enum dan punya 'value' (kode wilayah)
                if (!$this->city instanceof RegencyEnum) {
                    return $this->city;
                }

                // Gunakan cache agar tidak query ke DB berulang kali untuk kode yang sama
                return Cache::rememberForever('regency_name_' . $this->city->value, function () {
                    // Cari di model Regency berdasarkan kode, lalu ambil namanya.
                    // Jika tidak ketemu, kembalikan kodenya sebagai fallback.
                    return Regency::where('code', $this->city->value)->first()?->name ?? $this->city->value;
                });
            }
        );
    }

    /**
     * Dapatkan nama asli dari Kecamatan (district) langsung dari database.
     */
    protected function districtName(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->district instanceof DistrictEnum) {
                    return $this->district;
                }
                
                return Cache::rememberForever('district_name_' . $this->district->value, function () {
                    // Cari di model District berdasarkan kode, lalu ambil namanya.
                    return District::where('code', $this->district->value)->first()?->name ?? $this->district->value;
                });
            }
        );
    }

    // ... (Relasi Model Anda tidak berubah) ...
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