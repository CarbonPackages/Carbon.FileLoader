<?php

namespace Carbon\FileLoader\FusionObjects;

use Neos\Flow\Annotations as Flow;
use Neos\Fusion\FusionObjects\AbstractFusionObject;
use Neos\Flow\ResourceManagement\ResourceManager;

class FileImplementation extends AbstractFusionObject
{
    #[Flow\Inject]
    protected ResourceManager $resourceManager;

    public function getHashLength(): ?string
    {
        return $this->fusionValue('hashLength');
    }

    public function getInline(): ?string
    {
        return $this->fusionValue('inline');
    }

    public function getPackage(): ?string
    {
        return $this->fusionValue('package');
    }

    public function getFolder(): string
    {
        return (string) $this->fusionValue('folder');
    }

    public function getFile(): ?string
    {
        return $this->fusionValue('file');
    }

    /**
     * Return uri of the file
     *
     * @return string|null
     */
    public function evaluate(): ?string
    {
        $uri = $this->getFile();

        if (!$uri) {
            return null;
        }

        $hashLength = (int) $this->getHashLength();

        if (!str_contains($uri, '//')) {
            $package = $this->getPackage();
            if (!$package) {
                return null;
            }
            $folder = $this->getFolder();
            $uri = sprintf('resource://%s/Public/%s%s', $package, $folder, $uri);
        }

        if (str_starts_with($uri, 'resource://')) {
            $uri = $this->resourceManager->getPublicPackageResourceUriByPath($uri);
        }

        if ($this->getInline()) {
            return file_get_contents($uri) ?: '';
        }

        if ($hashLength <= 0) {
            return $uri;
        }

        $hashValue = '';
        try {
            $hashValue = sha1_file($uri);
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
