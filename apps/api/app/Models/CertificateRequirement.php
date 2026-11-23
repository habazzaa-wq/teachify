<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateRequirement extends Model
{
    use BelongsToTenant;

    public const TYPE_EXAM_BANK = 'exam_bank';

    public const TYPE_EXAM_LINK = 'exam_link';

    public const TYPE_PROJECT = 'project';

    protected $table = 'course_certificate_requirements';

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_certificate_rule_id',
        'exam_id',
        'type',
        'title',
        'description',
        'exam_link',
        'required_score',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'required_score' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(CourseCertificateRule::class, 'course_certificate_rule_id');
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
