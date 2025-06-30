<?php

namespace Carbon\FileLoader\EelHelper;

use Carbon\FileLoader\Service\FileService;
use Neos\Eel\ProtectedContextAwareInterface;
use Neos\Flow\Annotations as Flow;

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
     * Return uri of the file
     *
     * @param string $uri
     * @param boolean $inline
     * @param string|null $package
     * @param string|null $folder
     * @param integer|null $hashLength
     * @return string|null
     */
    public function uri(string $uri, bool $inline = false, ?string $package = null, ?string $folder = null, ?int $hashLength = null): ?string
    {
        return $this->fileService->uri(
            $uri,
            $inline,
            $package,
            $folder,
            $hashLength
        );
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
