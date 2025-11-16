<?php

namespace App\Utils;

use Illuminate\Http\Request;

class CustomPayloadEncoder
{
    private static function getK2(): string
    {
        // K2: Express->Laravel (decrypt)
        $k2 = env('K2');
        
        if (!$k2) {
            $k2 = 'hqhIYnZ$^puyLDd!73^EdubsLkdS02AJ';
        }
        
        // Ensure key is exactly 32 characters for AES-256
        return substr(str_pad($k2, 32, ' '), 0, 32);
    }

    private static function getK3(): string
    {
        // K3: Laravel->Express (encrypt)
        $k3 = env('K3');
        
        if (!$k3) {
            $k3 = 'cZ2ZwEycENUWhO!i2e#6IWQEnj^l42Vn';
        }
        
        // Ensure key is exactly 32 characters for AES-256
        return substr(str_pad($k3, 32, ' '), 0, 32);
    }

    public static function encode(array $data): array
    {
        $jsonString = json_encode($data);
        $encrypted = self::aesEncrypt($jsonString);
        
        return [
            'd' => $encrypted
        ];
    }

    public static function decodeRequest(string $encryptedData): Request
    {
        $decrypted = self::aesDecrypt($encryptedData, self::getK2());
        $data = json_decode($decrypted, true);
        
        // Extract special fields
        $method = $data['_method'] ?? 'POST';
        $uri = $data['_uri'] ?? '/';
        $parameters = $data['_parameters'] ?? [];
        $cookies = $data['_cookies'] ?? [];
        $files = $data['_files'] ?? [];
        $server = $data['_server'] ?? [];
        $headers = $data['_headers'] ?? [];
        $content = $data['_content'] ?? null;
        $json = $data['_json'] ?? null;
        
        // Remove special fields from data
        $cleanData = $data;
        unset($cleanData['_method'], $cleanData['_uri'], $cleanData['_parameters'], 
              $cleanData['_cookies'], $cleanData['_files'], $cleanData['_server'], 
              $cleanData['_headers'], $cleanData['_content'], $cleanData['_json']);
        
        // Merge clean data with parameters
        $allParameters = array_merge($cleanData, $parameters);
        
        // Prepare server variables
        $serverVars = array_merge([
            'REQUEST_METHOD' => strtoupper($method),
            'REQUEST_URI' => $uri,
            'SERVER_PROTOCOL' => 'HTTP/1.1',
            'REMOTE_ADDR' => '127.0.0.1',
        ], $server);
        
        // Add headers to server vars
        foreach ($headers as $key => $value) {
            $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
            $serverVars[$serverKey] = $value;
        }
        
        // Handle file uploads if present
        $uploadedFiles = [];
        if (!empty($files)) {
            foreach ($files as $key => $fileData) {
                if (is_array($fileData) && isset($fileData['tmp_name'])) {
                    $uploadedFiles[$key] = new \Illuminate\Http\UploadedFile(
                        $fileData['tmp_name'] ?? '',
                        $fileData['name'] ?? 'file',
                        $fileData['type'] ?? null,
                        $fileData['error'] ?? 0,
                        true
                    );
                } elseif (is_array($fileData)) {
                    $uploadedFiles[$key] = self::processFileArray($fileData);
                }
            }
        }
        
        // Create request with all parameters
        $request = Request::create(
            $uri,
            $method,
            $allParameters,
            $cookies,
            $uploadedFiles,
            $serverVars,
            $content
        );
        
        // If JSON data is present, replace the request content
        if ($json !== null) {
            $request->json()->replace($json);
        }
        
        // Set headers explicitly
        foreach ($headers as $key => $value) {
            $request->headers->set($key, $value);
        }
        
        return $request;
    }

    private static function processFileArray(array $fileData): array
    {
        $result = [];
        
        foreach ($fileData as $key => $value) {
            if (is_array($value)) {
                if (isset($value['tmp_name']) && !is_array($value['tmp_name'])) {
                    $result[$key] = new \Illuminate\Http\UploadedFile(
                        $value['tmp_name'] ?? '',
                        $value['name'] ?? 'file',
                        $value['type'] ?? null,
                        $value['error'] ?? 0,
                        true
                    );
                } else {
                    $result[$key] = self::processFileArray($value);
                }
            }
        }
        
        return $result;
    }

    private static function aesEncrypt(string $text): string
    {
        $key = self::getK3(); // K3: Laravel->Express (encrypt)
        $iv = openssl_random_pseudo_bytes(16); // Generate random IV
        
        $encrypted = openssl_encrypt($text, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        
        // Combine IV and encrypted data, then base64 encode
        $combined = $iv . $encrypted;
        
        return base64_encode($combined);
    }

    public static function decode(string $encryptedData): array
    {
        $decrypted = self::aesDecrypt($encryptedData, self::getK2());
        return json_decode($decrypted, true);
    }

    private static function aesDecrypt(string $encryptedData, string $key): string
    {
        $combined = base64_decode($encryptedData);
        
        if ($combined === false) {
            throw new \Exception('Failed to decode base64 data');
        }
        
        $iv = substr($combined, 0, 16);
        $encrypted = substr($combined, 16);
        
        $decrypted = openssl_decrypt($encrypted, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        
        if ($decrypted === false) {
            throw new \Exception('Failed to decrypt data');
        }
        
        return $decrypted;
    }
}