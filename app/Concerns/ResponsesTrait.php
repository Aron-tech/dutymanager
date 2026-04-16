<?php

namespace App\Concerns;

use Illuminate\Http\JsonResponse;

trait ResponsesTrait
{
    /**
     * @param string $message
     * @param mixed|null $data
     * @param int $code
     * @return JsonResponse
     */
    protected function successResponse(string $message, mixed $data = null, int $code = 200): JsonResponse
    {
        $response = [
            'status' => 'success',
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * @param string $message
     * @param mixed|null $error
     * @param int $code
     * @return JsonResponse
     */
    protected function errorResponse(string $message, mixed $error = null, int $code = 400): JsonResponse
    {
        $response = [
            'status' => 'error',
            'message' => $message,
        ];

        if ($error !== null) {
            $response['error'] = $error;
        }

        return response()->json($response, $code);
    }
}
