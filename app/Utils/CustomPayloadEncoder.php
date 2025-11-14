<?php

namespace App\Utils;

class CustomPayloadEncoder
{
    public static function encode(array $data): array
    {
        $key = self::generateRandomKey(10);

        $jsonString = json_encode($data);

        $scrambledString = self::vigenereCipher($jsonString, $key, 'encode');

        $encodedPayload = base64_encode($scrambledString);

        return [
            'd' => $encodedPayload,
            'k' => $key,
        ];
    }

    private static function vigenereCipher(string $input, string $key, string $mode): string
    {
        $keyLength = strlen($key);
        $output = '';

        for ($i = 0; $i < strlen($input); $i++) {
            $keyChar = $key[$i % $keyLength];
            $keyOffset = (int)$keyChar;

            $inputAscii = ord($input[$i]);

            if ($mode === 'encode') {
                $newAscii = $inputAscii + $keyOffset;
            } else {
                $newAscii = $inputAscii - $keyOffset;
            }

            $output .= chr($newAscii);
        }

        return $output;
    }

    private static function generateRandomKey(int $length): string
    {
        $key = '';
        for ($i = 0; $i < $length; $i++) {
            $key .= random_int(0, 9);
        }
        return $key;
    }
}