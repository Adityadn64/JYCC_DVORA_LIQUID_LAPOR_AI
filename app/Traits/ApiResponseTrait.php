<?php

namespace App\Traits;

use App\Utils\CustomPayloadEncoder;
use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    protected function successResponse($data = [], string $message = '', int $statusCode = 200): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        return response()->json(
            CustomPayloadEncoder::encode($payload),
            $statusCode
        );
    }

    protected function errorResponse(string $message, int $statusCode, array $errors = []): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json(
            CustomPayloadEncoder::encode($payload),
            $statusCode
        );
    }
}