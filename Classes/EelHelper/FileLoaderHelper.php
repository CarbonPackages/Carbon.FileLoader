<?php

namespace Carbon\FileLoader\EelHelper;

use Neos\Eel\ProtectedContextAwareInterface;

class FileLoaderHelper implements ProtectedContextAwareInterface
{
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
            return null;
        }
        $value = array_map('trim', $value);
        $value = array_filter($value);

        if (!count($value)) {
            return [];
        }

        return $value;
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
