<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneRegistration extends Model
{
    protected $table = 'phone_registrations';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['phone', 'token', 'created_at', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];
}