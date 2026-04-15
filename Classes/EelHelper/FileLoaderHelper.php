<?php

namespace Carbon\FileLoader\EelHelper;

use Carbon\FileLoader\Service\FileService;
use Neos\Eel\ProtectedContextAwareInterface;
use Neos\Flow\Annotations as Flow;
use function base64_encode;
use function rtrim;
use function strtr;

class FileLoaderHelper implements ProtectedContextAwareInterface
{
    #[Flow\Inject]
    protected FileService $fileService;

    /**
     * Filter items and convert them to an array
     *
     * @param array|string|null $value
     * @return array
     */
    public function filter($value = null): array
    {
        if (!$value) {
            return [];
        }
        if (is_string($value)) {
            $value = explode(',', $value);
        }
        if (!is_array($value)) {
            return [];
        }
        $value = array_map('trim', $value);
        $value = array_filter($value);

        if (!count($value)) {
            return [];
        }

        return $value;
    }

    /**
     * Return multiple uris of the files, separated by commas
     *
     * @param array<string>|string $value
     * @return string|null
     */
    public function uris(array|string $array = []): ?string
    {
        if (is_string($array)) {
            $array = [trim($array)];
        }
        if (!is_array($array) || !count($array)) {
            return null;
        }
        $result = [];
        foreach ($array as $item) {
            if (!is_string($item)) {
                continue;
            }
            $item = trim($item);
            if (!$item) {
                continue;
            }
            $result[] = $this->uri($item);
        }
        $array = array_filter(array_unique($result));
        if (!count($array)) {
            return null;
        }
        return implode(',', $array);
    }

    /**
     * Return uri of the file
     *
     * @param string $uri
     * @param boolean $inline
     * @param string|null $package
     * @param string|null $folder
     * @param integer|null $hashLength
     * @return string|null
     */
    public function uri(
        string $uri,
        bool $inline = false,
        ?string $package = null,
        ?string $folder = null,
        ?int $hashLength = null,
    ): ?string {
        return $this->fileService->uri($uri, $inline, $package, $folder, $hashLength);
    }

    /**
     * Encode string to Base64 URL format
     *
     * @param string $string The string to encode
     * @return string The string encoded
     */
    public function encodeUrl(string $string): string
    {
        $encoded = strtr(base64_encode($string), '+/', '-_');

        return rtrim($encoded, '=');
    }

    /**
     * All methods are considered safe
     *
     * @param string $methodName The name of the method
     * @return bool
     */
    public function allowsCallOfMethod($methodName)
    {
        return true;
    }
}
