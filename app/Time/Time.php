<?php

namespace App\Time;

use Illuminate\Support\Carbon;

class Time
{
    public static function getNow() {
        return Carbon::now('UTC')->timezone('Asia/Jakarta');
    }
}
