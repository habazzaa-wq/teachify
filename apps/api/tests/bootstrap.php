<?php

// Test bootstrap.
//
// This checkout shares its vendor/ directory with another working copy through
// an NTFS junction. PHP canonicalizes Windows junctions, so Composer's PSR-4
// autoloader and Application::inferBasePath() would otherwise resolve every
// App/Database/Tests class - and the application base path itself - inside the
// OTHER checkout. The overrides below pin everything back to this directory
// before the framework boots.

$baseDir = dirname(__DIR__);

$_ENV['APP_BASE_PATH'] = $baseDir;
$_SERVER['APP_BASE_PATH'] = $baseDir;

require __DIR__.'/../vendor/autoload.php';

// Re-register this checkout's PSR-4 roots ahead of Composer's
// junction-resolved mappings. Once a namespace matches, it is owned locally:
// missing classes must NOT silently fall through to the shared vendor's copy.
spl_autoload_register(function (string $class) use ($baseDir): void {
    $roots = [
        'App\\' => $baseDir.'/app/',
        'Database\\' => $baseDir.'/database/',
        'Tests\\' => $baseDir.'/tests/',
    ];

    foreach ($roots as $prefix => $dir) {
        if (! str_starts_with($class, $prefix)) {
            continue;
        }

        $file = $dir.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';

        if (is_file($file)) {
            require_once $file;
        }

        return;
    }
}, true, true);
