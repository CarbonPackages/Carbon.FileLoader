<?php

namespace Carbon\FileLoader\FusionObjects;

use Carbon\FileLoader\Service\FileService;
use Neos\Flow\Annotations as Flow;
use Neos\Fusion\FusionObjects\AbstractFusionObject;

class FileImplementation extends AbstractFusionObject
{
    #[Flow\Inject]
    protected FileService $fileService;

    public function getHashLength(): ?int
    {
        return $this->fusionValue('hashLength');
    }

    public function getInline(): ?bool
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
        return $this->fileService->uri(
            $this->getFile(),
            $this->getInline(),
            $this->getPackage(),
            $this->getFolder(),
            $this->getHashLength()
        );
    }
}
