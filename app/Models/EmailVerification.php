<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerification extends Model
{
    protected $table = 'email_verifications';
    protected $primaryKey = 'email';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['email', 'token', 'created_at', 'expires_at'];
    
    protected $casts = ['expires_at' => 'datetime'];
}