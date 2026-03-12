<?php

namespace Carbon\FileLoader\Service;

use Neos\Flow\Annotations as Flow;
use Neos\Flow\ResourceManagement\ResourceManager;

class FileService
{
    #[Flow\Inject]
    protected ResourceManager $resourceManager;

    #[Flow\InjectConfiguration('hashLength')]
    protected $hashLength;

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
        if (!$uri) {
            return null;
        }
        if (!isset($hashLength)) {
            $hashLength = $this->hashLength;
        }

        if (!str_contains($uri, '//')) {
            if (!$package) {
                return null;
            }
            $uri = sprintf('resource://%s/Public/%s%s', $package, $folder, $uri);
        }

        if ($inline) {
            return file_get_contents($uri) ?: '';
        }

        $flowResourcePathOrUri = $uri;
        if (str_starts_with($flowResourcePathOrUri, 'resource://')) {
            $uri = $this->resourceManager->getPublicPackageResourceUriByPath($flowResourcePathOrUri);
        }

        if ($hashLength <= 0) {
            return $uri;
        }

        $hashValue = '';
        try {
            $hashValue = sha1_file($flowResourcePathOrUri);
            if (strlen($hashValue) > $hashLength) {
                $hashValue = substr($hashValue, 0, $hashLength);
            }
            $hashPrefix = str_contains($uri, '?') ? '&' : '?';
            $hashValue = $hashPrefix . 'h=' . $hashValue;
        } catch (\Throwable $th) {
        }

        return $uri . $hashValue;
    }
}
