<?php

namespace App\Traits;

use App\Utils\CustomPayloadEncoder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait ApiResponseTrait
{
    protected function decodeRequest(Request $request): Request
    {
        if ($request->has('d') && is_string($request->input('d'))) {
            return CustomPayloadEncoder::decodeRequest($request->input('d'));
        }
        return $request;
    }

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
