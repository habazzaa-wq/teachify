<?php

namespace App\Http\Middleware;

use App\Models\Course;
use App\Services\Instructors\InstructorCourseAuthorization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAssignedInstructorCourse
{
    public function __construct(
        private readonly InstructorCourseAuthorization $authorization,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $course = $request->route('course');
        $user = $request->user();

        abort_unless($course instanceof Course && $user !== null, 404);
        abort_unless(
            $this->authorization->canAccessCourse($user, $course),
            403,
        );

        return $next($request);
    }
}
