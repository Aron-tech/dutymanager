<?php

namespace App\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait FileHandlerTrait
{
    public static function generateUniqueFileName(UploadedFile $file, string $prefix = ''): string
    {
        $extension = $file->getClientOriginalExtension();
        $uuid = Str::uuid()->toString();

        return empty($prefix)
            ? "{$uuid}.{$extension}"
            : "{$prefix}_{$uuid}.{$extension}";
    }

    public static function storeFile(UploadedFile $file, string $directory, ?string $disk = 'public'): string|false
    {
        $fileName = static::generateUniqueFileName($file);

        return $file->storeAs($directory, $fileName, $disk);
    }

    public static function updateFile(UploadedFile $file, string $directory, ?string $old_path = null, ?string $disk = 'public'): string|false
    {
        if ($old_path) {
            static::deleteFile($old_path, $disk);
        }

        return static::storeFile($file, $directory, $disk);
    }

    public static function deleteFile(?string $path, ?string $disk = 'public'): bool
    {
        if (empty($path)) {
            return false;
        }

        if (Storage::disk($disk)->exists($path)) {
            return Storage::disk($disk)->delete($path);
        }

        return false;
    }

    public static function getFileUrl(?string $path, ?string $disk = 'public'): ?string
    {
        if (empty($path)) {
            return null;
        }

        return Storage::disk($disk)->url($path);
    }

    /**
     * @param string $base64_string
     * @param string $directory
     * @param string|null $disk
     * @return string|false
     */
    public static function storeBase64Image(string $base64_string, string $directory, ?string $disk = 'public'): string|false
    {
        @[$type, $file_data] = explode(';', $base64_string);
        @[, $file_data] = explode(',', $file_data);

        $imageName = Str::uuid()->toString().'.png';
        $path = trim($directory, '/').'/'.$imageName;

        $success = Storage::disk($disk)->put($path, base64_decode($file_data));

        return $success ? $path : false;
    }
}
