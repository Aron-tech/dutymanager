<?php

namespace App\DTO;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

readonly class ServiceResponseDTO
{
    /**
     * @param bool $success
     * @param mixed|null $data
     * @param string $message
     */
    public function __construct(
        public bool $success,
        public mixed $data = null,
        public string $message = '',
    ) {}
}
