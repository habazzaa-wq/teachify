<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Permanent user asset storage disk
    |--------------------------------------------------------------------------
    |
    | New permanent user-generated assets (avatars, scanned question images,
    | and media-library uploads when Bunny is not configured) are written to
    | this filesystem disk. It defaults to "public" to preserve the current
    | single-server behaviour.
    |
    | For multi-node deployments set this to a shared / object-storage disk
    | (for example "s3", which is already configured in filesystems.php) so
    | any web node can serve the asset. Existing local assets are preserved
    | and continue to be served through the "public" disk symlink; only new
    | writes honour this setting.
    |
    */

    'storage_disk' => env('MEDIA_STORAGE_DISK', 'public'),

];
