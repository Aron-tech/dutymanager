<?php

namespace App\Concerns;

use App\DTO\ServiceResponseDTO;
use Symfony\Component\HttpFoundation\Response;

trait ServiceTrait
{
    protected function makeResponse(bool $success, mixed $data, string $message = '', int $status = Response::HTTP_OK): ServiceResponseDTO
    {
        return new ServiceResponseDTO($success, $data, $message, $status);
    }
}
