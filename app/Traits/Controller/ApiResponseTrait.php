<?php

namespace App\Traits\Controller;

use App\Utils\CustomPayloadEncoder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

trait ApiResponseTrait
{
    protected function decodeRequest(Request $request): Request
    {
        if ($request->has('d') && is_string($request->input('d'))) {
            return CustomPayloadEncoder::decodeRequest($request->input('d'));
        }
        return $request;
    }

    protected function validateRequest(Request $request, array $rules, array $messages = [], string $summaryErrorMessage = 'Data yang diberikan tidak valid.'): array
    {
        // Membuat instance Validator secara manual
        $validator = Validator::make($request->all(), $rules, $messages);

        // Cek jika validasi gagal
        if ($validator->fails()) {
            throw new HttpResponseException(
                $this->errorResponse(
                    $summaryErrorMessage,
                    422,
                    $validator->errors()->toArray()
                )
            );
        }

        return $validator->validated();
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
