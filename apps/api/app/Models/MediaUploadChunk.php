<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaUploadChunk extends Model
{
    protected $fillable = [
        'media_upload_session_id',
        'chunk_index',
        'chunk_hash',
        'status',
        'byte_offset',
        'byte_length',
        'temp_path',
    ];

    protected function casts(): array
    {
        return [
            'chunk_index' => 'integer',
            'byte_offset' => 'integer',
            'byte_length' => 'integer',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(MediaUploadSession::class, 'media_upload_session_id');
    }

    public function isUploaded(): bool
    {
        return $this->status === 'uploaded';
    }
}
