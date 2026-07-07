<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseCertificateRule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'certificate_template_id',
        'enabled',
        'require_course_completion',
        'require_quiz_pass',
        'require_assignment_pass',
        'minimum_completion_percentage',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'require_course_completion' => 'boolean',
            'require_quiz_pass' => 'boolean',
            'require_assignment_pass' => 'boolean',
            'minimum_completion_percentage' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'certificate_template_id');
    }
}
