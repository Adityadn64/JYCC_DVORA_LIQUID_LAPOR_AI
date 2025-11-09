<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class TimestampArrayCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if (is_null($value)) {
            return null;
        }

        $cleanedValue = trim($value, '{}');

        if (empty($cleanedValue)) {
            return [];
        }
        
        $timestampStrings = str_getcsv($cleanedValue);

        $result = [];
        foreach ($timestampStrings as $timestamp) {
            $result[] = Carbon::parse(trim($timestamp, '"'));
        }

        return $result;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if (is_null($value) || !is_array($value)) {
            return null;
        }

        $dbFormattedTimestamps = [];
        foreach($value as $item) {
            $carbonInstance = Carbon::parse($item);
            
            $dbFormattedTimestamps[] = '"' . $carbonInstance->toDateTimeString() . '"';
        }

        return '{' . implode(',', $dbFormattedTimestamps) . '}';
    }
}