<?php

namespace App\Time;

class Time
{
    public static function getNow() {
        return now()->timezone('Asia/Jakarta');
    }
}
