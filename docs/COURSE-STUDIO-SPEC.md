# COURSE STUDIO — Complete Engineering Specification

> **Enterprise Multi-Tenant LMS Platform**
>  
> **Product:** Course Studio (Replacement Module)
>  
> **Status:** Engineering Blueprint — v1.0
>  
> **Audience:** Engineering Team, QA, Product, Design
>  
> **Stack (for context):** Laravel 12 (API), Next.js 15 (Frontend), React 19, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, React Query
>  
> **Modes:** Arabic RTL, Dark Mode, Light Mode
>  
> **Architecture:** Enterprise Multi-Tenant SaaS

---

# TABLE OF CONTENTS

1. Product Vision
2. Personas
3. Complete User Journey
4. Information Architecture
5. Navigation Architecture
6. Screen Inventory
7. Screen Specification Template
8. Courses Home
9. Course Studio
10. Lecture Builder
11. Section Builder
12. Content Builder
13. Content Picker
14. Inspector Panel
15. Publishing Experience
16. Students
17. Analytics
18. SEO
19. Settings
20. Micro Interactions
21. Design System
22. Responsive Behaviour
23. Accessibility
24. Performance
25. Future Extension Points

---

# 1. PRODUCT VISION

## 1.1 Why This Module Exists

The existing Course module is a CRUD-based admin panel. It treats course creation as data entry — tables, forms, and list views. Instructors hate it because it forces them to think like database operators instead of educators.

Course Studio replaces this entirely. It is a premium teaching workspace designed for instructors to build world-class learning experiences. It prioritizes pedagogy over data management, structure over flat lists, and flow over batch operations.

This module is the core differentiator of the LMS platform. Competitors offer course builders. Course Studio offers a **teaching studio** — the same mental shift as moving from a text editor to a design tool like Figma.

## 1.2 Goals

| Goal | Description |
|------|-------------|
| G1 | Enable instructors to build courses faster by 60% compared to the old CRUD module |
| G2 | Eliminate the mental gap between course design and course delivery |
| G3 | Provide a single workspace where the entire course structure is visible and manipulable |
| G4 | Support 10 distinct content types with zero friction switching between them |
| G5 | Enable real-time collaboration between instructors and teaching assistants |
| G6 | Provide contextual inspection and editing via the Inspector Panel — no full-page reloads |
| G7 | Achieve 95+ Lighthouse accessibility score |
| G8 | Support Arabic RTL and Light/Dark mode natively |
| G9 | Allow partial publishing: publish lectures individually, not only the whole course |
| G10 | Reduce course publishing errors by 80% via the Publishing Checklist |

## 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Course creation time | < 15 minutes for a minimal course (3 lectures, 1 section each, video content) |
| Time to first lecture added | < 90 seconds from landing on Course Home |
| Instructor task completion rate | > 90% complete their course without support |
| Content type adoption | At least 6 content types used per published course |
| Publishing success rate | > 95% on first attempt |
| NPS for Course Studio | > 50 |
| Task abandonment | < 5% during lecture/section/content creation |
| Reorder interactions | > 80% done via drag-and-drop (not manual reorder buttons) |

## 1.4 Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| N1 | Not a full page builder / drag-and-drop visual editor for content layout | Content is vertically stacked per section; we do not need arbitrary layout |
| N2 | Not a video editor or PDF editor | Content is authored externally and uploaded/referenced |
| N3 | Not a real-time collaborative editor (Google Docs style) | Collaboration is async via notes and section-level comments |
| N4 | Not a replacement for Quiz/Exam engine | Exams are selected from the Exam Bank (future) |
| N5 | Not a SCORM player | SCORM packages are uploaded and played in a wrapper |
| N6 | Not a marketplace or discovery tool | This is the authoring workspace, not the student-facing store |
| N7 | Not a social learning or discussion tool | Discussions belong in the student-facing platform |

---

# 2. PERSONAS

## 2.1 Persona: Instructor

**Role:** Primary user. Creates, structures, and publishes courses.

**Capabilities:**
- Create courses
- Invite Teaching Assistants
- Create / edit / delete / duplicate / reorder / publish / archive lectures
- Create / edit / delete / duplicate / reorder sections within lectures
- Add all content types to sections
- Configure content settings via Inspector Panel
- Manage course settings (title, description, thumbnail, pricing, category, tags, etc.)
- Review and pass the Publishing Checklist
- View analytics per course, per lecture, per content item
- Manage student enrollment manually
- Assign Teaching Assistants to specific lectures

**Permissions:**
- Full ownership of own courses
- Cannot create courses on behalf of another Instructor
- Cannot access other Instructors' courses unless granted co-instructor or TA role
- Can delete own courses (soft delete, 30-day recovery window)
- Can set course to draft / published / archived

## 2.2 Persona: Teaching Assistant (TA)

**Role:** Assists Instructor in building course content.

**Capabilities:**
- View assigned lectures and their sections
- Edit section content
- Add / edit / delete / reorder content items within assigned sections
- Add notes and comments on sections and content items
- Upload media (videos, PDFs, resources) to assigned sections
- View course structure (read-only for non-assigned lectures)

**Restrictions:**
- Cannot create or delete lectures
- Cannot reorder lectures
- Cannot publish any part of the course
- Cannot change course settings
- Cannot delete content types that they did not create (unless explicitly assigned)
- Cannot invite other TAs
- Cannot manage pricing
- Cannot access analytics

## 2.3 Persona: Admin

**Role:** Platform administrator. Manages courses across all tenants.

**Capabilities:**
- View all courses across tenant
- Force-unpublish any course
- Assign any Instructor to any course
- Delete any course (hard delete)
- View course analytics across tenant
- Manage course categories (global)
- Configure allowed content types per tenant

**Restrictions:**
- Cannot edit course content directly (read-only view of Course Studio)
- Cannot create courses
- Cannot become co-instructor

## 2.4 Persona: Student (Read-Only)

**Role:** Consumes the course. Never enters Course Studio.

**Capabilities:**
- View published courses
- View published lectures in sequence
- View section content sequentially
- Mark content as completed
- Take exams and submit assignments
- Download resources

**Studio Interaction:**
- Students never access Course Studio
- Course Studio is Instructor-side only
- Students consume the output of Course Studio in a separate learning interface

---

# 3. COMPLETE USER JOURNEY

## 3.1 Journey: Create and Publish a Course

### Phase 1: Enter Course Studio

1. Instructor navigates to `/courses` (Courses Home)
2. System displays grid of existing courses + "Create Course" card
3. Instructor clicks "Create Course"
4. A modal slides in from right (Drawer) with three fields:
   - Course Title (text input, required, max 120 chars)
   - Course Subtitle (text input, optional, max 200 chars)
   - Course Category (select dropdown, required)
5. Instructor fills fields, clicks "Create"
6. Drawer slides out, system navigates to `/courses/{courseId}/studio`
7. **Entry Animation:** Course Studio fades in with the Left Navigator sliding from left, workspace fading in center, Inspector Panel sliding from right
8. A welcome toast appears: "Course created! Add your first lecture to begin."
9. Empty state is shown: Left Navigator is empty, Center Workspace shows "Create your first lecture" hero

### Phase 2: Create Lectures

10. Instructor clicks "Create Lecture" button in Center Workspace
11. A section appears at the top of the workspace — the New Lecture Form (inline, not a modal):
    - Lecture Title (required, max 100 chars)
    - Lecture Description (optional, textarea, max 500 chars)
    - Estimated Duration (optional, number input, minutes)
12. Instructor types title, clicks "Add Lecture" or presses Enter
13. Lecture appears in Left Navigator. First lecture is auto-selected.
14. Center Workspace transitions to show the Lecture Builder view.
15. Instructor adds 5 lectures using the same flow.
16. Reordering: Instructor drags Lecture 4 above Lecture 2 in Left Navigator.
    - Drag handle (6 dots grid) on left of each lecture item
    - Drop animation: items smoothly reorder with spring physics
    - The course structure bar above workspace updates to reflect new order

### Phase 3: Build Sections

17. With Lecture 1 selected, Instructor sees empty section state:
    - "This lecture has no sections. Add your first section to organize content."
18. Instructor clicks "Add Section" button
19. Inline form appears:
    - Section Title (required, max 100 chars)
    - Section Description (optional, textarea, max 300 chars)
20. Instructor fills and confirms
21. Section appears nested under Lecture 1 in Left Navigator
22. In Center Workspace, Section Builder opens showing:
    - Section header (title, description, drag handle)
    - Empty content area with "Add content" button
    - Section appears collapsed by default in Navigator (expandable via chevron)

### Phase 4: Add Content

23. Instructor clicks "Add Content" in the section area
24. Content Picker appears as a horizontal strip of 9 content type icons:
    - Video (film icon)
    - PDF (file-text icon)
    - Exam (clipboard-check icon)
    - Assignment (pencil icon)
    - Resource (folder icon)
    - Audio (headphones icon)
    - Live Session (radio icon)
    - External Link (link icon)
    - SCORM (box icon)
    - Certificate (award icon)
25. Instructor clicks Video
26. Content Picker morphs into Video Uploader inline within the section
27. Instructor drags a video file or clicks to browse
28. Upload progress bar appears (circular determinate)
29. On completion: video thumbnail, filename, duration displayed
30. Instructor can add a title override, description, and set "Require completion" toggle
31. Instructor repeats for PDF, Resource, and External Link
32. Content items stack vertically in the section in the order added
33. Instructor reorders content items via drag handle on each item

### Phase 5: Configure via Inspector

34. Instructor clicks on the Lecture 1 header in Center Workspace
35. Inspector Panel on the right updates to show Lecture properties:
    - Title (editable input)
    - Description (editable textarea)
    - Duration (display)
    - Status badge (Draft / Published / Archived)
    - Published date (if applicable)
    - "Duplicate Lecture" button
    - "Delete Lecture" button (with confirmation)
36. Instructor clicks on the Section 1 header
37. Inspector Panel updates to show Section properties:
    - Title (editable input)
    - Description (editable textarea)
    - Order (display, non-editable, shows position number)
    - Number of content items
38. Instructor clicks on the Video content item
39. Inspector Panel updates to show Video properties:
    - Title override (input)
    - Description (textarea)
    - Source video (filename, link to Bunny Media Library)
    - Duration (auto-detected or manual)
    - "Require 100% completion" toggle
    - "Allow skipping" toggle
    - Thumbnail preview
    - "Replace Video" button

### Phase 6: Publishing

40. Instructor clicks "Publish" button in top header bar
41. Publishing Checklist slides in from right (overlays Inspector Panel)
42. Checklist shows:
    - ✅ Course has a title
    - ✅ Course has a category
    - ✅ At least one lecture exists
    - ❌ Lecture 2 has no sections — Warning (yellow)
    - ✅ All lectures have at least one section
    - ❌ Lecture 3, Section 1 has no content — Warning (yellow)
    - ✅ All content items have valid sources
    - ⚠️ Course has no thumbnail — Warning (yellow, non-blocking)
    - ✅ Course has a description
    - ⚠️ Course has no price set — Warning (yellow, non-blocking)
    - ✅ No empty content items
43. Instructor fixes Lecture 2 (adds a section), Lecture 3 Section 1 (adds content)
44. Instructor navigates to Course Settings, uploads thumbnail, sets price
45. All items turn green
46. Instructor clicks "Publish Now"
47. Success animation: confetti particles burst from cursor position
48. Toast: "Course published successfully!"
49. Course status changes to Published
50. A "Share" button appears: clicking it copies the student-facing course URL

---

# 4. INFORMATION ARCHITECTURE

## 4.1 Hierarchy

```
Course
├── Lectures (ordered list)
│   ├── Lecture 1
│   │   ├── Sections (ordered list)
│   │   │   ├── Section 1
│   │   │   │   ├── Content Items (ordered list)
│   │   │   │   │   ├── Video
│   │   │   │   │   ├── PDF
│   │   │   │   │   ├── Exam
│   │   │   │   │   ├── Assignment
│   │   │   │   │   ├── Resource
│   │   │   │   │   ├── Audio
│   │   │   │   │   ├── Live Session
│   │   │   │   │   ├── External Link
│   │   │   │   │   ├── SCORM
│   │   │   │   │   └── Certificate
│   │   │   ├── Section 2
│   │   │   │   └── Content Items (ordered list)
│   │   │   └── ...
│   ├── Lecture 2
│   │   ├── Sections
│   │   └── ...
│   └── ...
└── Course Settings
```

## 4.2 Course Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | |
| tenant_id | UUID | auto | Multi-tenant isolation |
| instructor_id | UUID | auto | Owner |
| title | string | yes | Max 120 chars |
| subtitle | string | no | Max 200 chars |
| slug | string | auto | Auto-generated from title |
| description | text | no | Max 5000 chars |
| category_id | UUID | yes | |
| thumbnail_url | string | no | |
| cover_url | string | no | |
| price | decimal | no | |
| sale_price | decimal | no | |
| currency | string | no | ISO 4217 |
| duration_minutes | int | auto | Sum of all lecture durations |
| lecture_count | int | auto | |
| section_count | int | auto | |
| content_count | int | auto | |
| difficulty | enum | no | beginner, intermediate, advanced, all |
| tags | array | no | Max 10 |
| language | string | no | |
| status | enum | auto | draft, published, archived |
| published_at | datetime | auto | |
| created_at | datetime | auto | |
| updated_at | datetime | auto | |
| deleted_at | datetime | auto | Soft delete |

## 4.3 Lecture Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | |
| course_id | UUID | yes | FK |
| title | string | yes | Max 100 chars |
| description | text | no | Max 500 chars |
| duration_minutes | int | no | Estimated; can be auto-calculated from content |
| sort_order | int | auto | |
| status | enum | auto | draft, published, archived |
| published_at | datetime | auto | |
| created_at | datetime | auto | |
| updated_at | datetime | auto | |

## 4.4 Section Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | |
| lecture_id | UUID | yes | FK |
| title | string | yes | Max 100 chars |
| description | text | no | Max 300 chars |
| sort_order | int | auto | |
| created_at | datetime | auto | |
| updated_at | datetime | auto | |

## 4.5 Content Entity (Polymorphic)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | |
| section_id | UUID | yes | FK |
| content_type | enum | yes | video, pdf, exam, assignment, resource, audio, live_session, external_link, scorm, certificate |
| title | string | no | Override title; falls back to content source title |
| description | text | no | |
| source_url | string | conditional | Required for video, pdf, audio, resource, external_link, scorm |
| source_id | UUID | no | FK to media library or external service |
| duration_minutes | int | no | For video, audio |
| require_completion | boolean | no | Default: true for video, exam, assignment |
| allow_skipping | boolean | no | Default: false for video, exam |
| is_free_preview | boolean | no | Can students preview without enrollment |
| sort_order | int | auto | |
| metadata | json | no | Content-type-specific metadata |
| created_at | datetime | auto | |
| updated_at | datetime | auto | |

### 4.5.1 Content Type Metadata Schemas

**Video:**
```json
{
  "file_name": "string",
  "file_size": "number",
  "mime_type": "string",
  "width": "number",
  "height": "number",
  "thumbnail_url": "string",
  "bunny_media_id": "string",
  "has_captions": "boolean",
  "captions_language": "string"
}
```

**PDF:**
```json
{
  "file_name": "string",
  "file_size": "number",
  "page_count": "number",
  "allow_download": "boolean"
}
```

**Exam:**
```json
{
  "exam_bank_id": "UUID",
  "time_limit_minutes": "number",
  "passing_score": "number",
  "attempts_allowed": "number",
  "shuffle_questions": "boolean",
  "show_results_immediately": "boolean"
}
```

**Assignment:**
```json
{
  "instructions": "text",
  "due_date": "datetime",
  "max_score": "number",
  "submission_type": "enum(file|text|both)",
  "allow_late_submission": "boolean",
  "late_penalty_percent": "number"
}
```

**Resource:**
```json
{
  "file_name": "string",
  "file_size": "number",
  "mime_type": "string",
  "allow_download": "boolean"
}
```

**Audio:**
```json
{
  "file_name": "string",
  "file_size": "number",
  "mime_type": "string",
  "duration_seconds": "number",
  "thumbnail_url": "string"
}
```

**Live Session:**
```json
{
  "provider": "enum(zoom|meet|teams|custom)",
  "provider_url": "string",
  "scheduled_at": "datetime",
  "duration_minutes": "number",
  "recording_url": "string",
  "recording_available": "boolean"
}
```

**External Link:**
```json
{
  "url": "string",
  "open_in_new_tab": "boolean",
  "favicon_url": "string"
}
```

**SCORM:**
```json
{
  "file_name": "string",
  "file_size": "number",
  "version": "enum(1.2|2004)",
  "completion_threshold": "number"
}
```

**Certificate:**
```json
{
  "template_id": "UUID",
  "passing_requirements": "string",
  "auto_issue": "boolean"
}
```

---

# 5. NAVIGATION ARCHITECTURE

## 5.1 Route Map

```
/courses                                          → Courses Home
/courses/create                                   → Create Course Drawer (overlay on Courses Home)
/courses/{courseId}/studio                        → Course Studio (main workspace)
/courses/{courseId}/studio/settings               → Course Settings (within Studio)
/courses/{courseId}/studio/analytics              → Course Analytics (within Studio)
/courses/{courseId}/studio/students               → Student Management (within Studio)
/courses/{courseId}/preview                       → Student preview (read-only layout)
```

## 5.2 Global Navigation (App Shell)

Outside Course Studio, the app has a global sidebar (collapsible) with:
- Dashboard (home icon)
- Courses (book-open icon) — **active**
- Analytics (chart-bar icon)
- Students (users icon)
- Settings (cog icon)

Clicking "Courses" navigates to `/courses`.

## 5.3 Course Studio Internal Navigation

Course Studio is a full-screen workspace that **replaces the global sidebar** with its own contextual navigation.

### Top Header Bar (persistent across all Studio views)

| Element | Description |
|---------|-------------|
| Back arrow + "Back to Courses" | Navigate to /courses |
| Course title (truncated) | Display only; click opens dropdown to rename |
| Status badge | Draft / Published / Archived with color |
| "Preview" button | Opens /courses/{id}/preview in new tab |
| "Settings" button | Within-studio navigation to settings tab |
| "Analytics" button | Within-studio navigation to analytics tab |
| "Students" button | Within-studio navigation to students tab |
| "Publish" button | Opens Publishing Checklist (primary CTA, prominent) |
| User avatar | Dropdown: Profile, Help, Logout |

### Breadcrumbs (below header, contextual)

Examples:
- Studio → Course Studio (when in main builder)
- Studio → Settings (when in settings)
- Studio → Analytics (when in analytics)

### Left Navigator

See Chapter 9 for full specification.

## 5.4 Breadcrumb Structure

```
Home  >  Courses  >  {Course Title}  >  Studio
Home  >  Courses  >  {Course Title}  >  Settings
Home  >  Courses  >  {Course Title}  >  Analytics
Home  >  Courses  >  {Course Title}  >  Students
```

Breadcrumbs use the format: `text → text → text → text`

## 5.5 Tab Navigation (within Studio)

Four tabs below the header:
1. **Studio** (default) — The main builder workspace
2. **Settings** — Course settings form
3. **Analytics** — Course performance data
4. **Students** — Enrollment management

Tabs are horizontal, underlined active state, with subtle slide animation on switch.

---

# 6. SCREEN INVENTORY

| # | Screen | Route | Type |
|---|--------|-------|------|
| S1 | Courses Home | /courses | Page |
| S2 | Course Studio (Builder) | /courses/{id}/studio | Page |
| S3 | Course Settings | /courses/{id}/studio/settings | Tab Panel |
| S4 | Course Analytics | /courses/{id}/studio/analytics | Tab Panel |
| S5 | Student Management | /courses/{id}/studio/students | Tab Panel |
| S6 | Course Preview | /courses/{id}/preview | Page |
| — | Create Course Drawer | /courses?create=true | Drawer |
| — | Publishing Checklist | /courses/{id}/studio?publish=true | Drawer |
| — | Content Picker Strip | Inline within Studio | Component |
| — | Media Uploader | Inline within Studio | Component |
| — | Inspector Panel | Inline within Studio | Panel |
| — | Confirmation Dialog | Any | Modal |
| — | Delete Confirmation | Any | Modal |
| — | Share Course Dialog | Studio header | Modal |

Total unique screens: 6 full pages + 8 components/dialogs.

---

# 7. SCREEN SPECIFICATION TEMPLATE

Every screen below follows this exact template with zero omissions.

---

# 8. COURSES HOME

## 8.1 Purpose

The Courses Home is the landing page for all instructors. It provides an overview of all courses owned by or assigned to the current user, with quick access to create, continue editing, preview, or manage each course.

## 8.2 Goals

- Enable instructors to find any course within 3 seconds
- Allow creation of a new course in under 30 seconds
- Surface "Continue Working" for courses in draft state
- Support pinning for quick access
- Provide clear visual status of every course
- Enable bulk actions: archive, delete, duplicate

## 8.3 Entry Points

- Global navigation sidebar "Courses" link
- Post-login redirect (if user has courses)
- Breadcrumb navigation from within Course Studio

## 8.4 Exit Points

- Click any course card → navigates to `/courses/{id}/studio`
- Click "Create Course" → opens draw, on create navigates to `/courses/{id}/studio`
- Click "Back to Dashboard" via breadcrumb
- Click user avatar → dropdown to logout

## 8.5 Displayed Information

### Page Layout (Pixel-level)

```
┌──────────────────────────────────────────────────────────────┐
│ [Header]                                                     │
│  My Courses (H1, 32px, bold)          [Search] [Create]      │
│  Breadcrumb: Home > Courses                                  │
├──────────────────────────────────────────────────────────────┤
│ [Quick Filters Bar]                                          │
│  [All] [Draft] [Published] [Archived]     Sort: [Newest ▼]   │
│                                                            │
│ [Pinned Section] (if any pinned courses)                     │
│  "Pinned" label (12px, uppercase, muted)                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                                │
│  │ Card │ │ Card │ │ Card │                                │
│  └──────┘ └──────┘ └──────┘                                │
│                                                            │
│ [Continue Working Section] (max 4 cards, if any drafts)    │
│  "Continue Working" (16px, semibold)                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ Card │ │ Card │ │ Card │ │ Card │                      │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                            │
│ [Collections / Categories Section]                          │
│  "Collections" (16px, semibold)                             │
│  [All] [Category 1] [Category 2] [Category 3] ...         │
│                                                            │
│ [Course Grid]                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                               │
│  │ Card │ │ Card │ │ Card │                               │
│  └──────┘ └──────┘ └──────┘                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                               │
│  │ Card │ │ Card │ │ Card │                               │
│  └──────┘ └──────┘ └──────┘                               │
│                                                            │
│ [Pagination / Infinite Scroll]                             │
└──────────────────────────────────────────────────────────────┘
```

### Spacing

- Page padding: 32px left/right, 24px top/bottom
- Header bottom margin: 24px
- Filter bar bottom margin: 20px
- Section spacing: 28px between sections
- Card grid gap: 20px
- Card padding: 16px

### Typography

| Element | Size | Weight | Color (Light) | Color (Dark) |
|---------|------|--------|---------------|--------------|
| Page Title (H1) | 32px | 700 | gray-900 | gray-50 |
| Section Titles | 16px | 600 | gray-700 | gray-300 |
| Card Title | 16px | 600 | gray-900 | gray-50 |
| Card Subtitle | 14px | 400 | gray-500 | gray-400 |
| Card Meta | 12px | 400 | gray-400 | gray-500 |
| Badge text | 12px | 500 | white | white |
| Filter label | 14px | 500 | gray-700 | gray-300 |

### Search

- Search bar at top-right of header area
- Width: 320px
- Icon: magnifying glass on left
- Placeholder: "Search courses..."
- Debounce: 300ms
- Results filter client-side (after initial fetch)
- Search matches: title, subtitle, tags
- Empty search state: "No courses match your search" with illustration

### Filters

**Quick Status Filters:** Pills/chips in a horizontal row
- "All" (default active)
- "Draft" (with count badge)
- "Published" (with count badge)
- "Archived" (with count badge)

Active pill: filled background (primary-600), white text
Inactive pill: outlined, gray-300 border, gray-700 text
Hover: subtle background tint

**Sort Dropdown:**
- "Newest First" (default)
- "Oldest First"
- "Alphabetical A-Z"
- "Alphabetical Z-A"
- "Last Modified"

### Course Card

**Dimensions:** 280px wide × 200px tall (responsive: minmax(260px, 1fr))

**Structure:**
```
┌──────────────────────────────┐
│ [Thumbnail Area - 140px h]   │
│                              │
│     (Course thumbnail or     │
│      gradient placeholder)   │
│                              │
│                     [Status] │
├──────────────────────────────┤
│ Course Title                  │
│ Instructor Name               │
│ 12 lectures · 3h 45m         │
│ Updated 2 days ago           │
│                          [•••]│
└──────────────────────────────┘
```

**Thumbnail:**
- 140px height, full width
- Rounded top corners (radius: 12px)
- If no thumbnail: gradient background based on category color, with category icon centered
- Status badge: 12px, rounded-full, absolute positioned top-right, 8px offset

**Card Body:**
- Title: 1 line, truncated with ellipsis
- Instructor: 14px, gray-500
- Meta row: clock icon + lecture count + duration
- "Updated X ago" — relative time
- 3-dot menu (kebab) top-right corner of card

**Card Interactions:**
- Hover: subtle elevation increase (shadow-md → shadow-lg), slight Y offset (-2px), cursor pointer
- Click on card body (not kebab): navigate to `/courses/{id}/studio`
- Click kebab: dropdown menu appears

**Kebab Dropdown Items:**
- "Open Studio" (default action)
- "Preview" (opens new tab)
- "Duplicate" (with brief loading, toast on completion)
- "Pin to Top" / "Unpin" (toggles pinning)
- "Archive" / "Unarchive"
- "Delete" (with confirmation modal — "Are you sure? This can be undone within 30 days.")

### Pinned Courses Section

- Max 6 pinned courses
- Section is titled "Pinned" with a pin icon
- Pin icon on card: filled (pinned) or outline (unpinned)
- Pinned courses appear at top regardless of sort/filter
- If no pinned courses, section is hidden

### Continue Working Section

- Shows up to 4 draft courses with the most recent modification date
- Section title: "Continue Working" with a clock-arrow icon
- Cards show a progress bar at bottom: (content_count / estimated total)
- Each card has a green "Resume" button on hover
- If no drafts exist, section is hidden

### Collections / Category Filter

- Horizontal scrollable row of category chips
- "All" chip is first, always visible
- Each chip shows category name + count
- Active chip: filled primary color
- Click filter the grid to only show courses in that category
- Smooth fade transition when filtering

### Course Grid (Responsive)

- CSS Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Max 4 columns on large screens (1400px+)
- 3 columns on standard (1200px)
- 2 columns on tablet (768px)
- 1 column on mobile (<640px)

### Empty State (No Courses)

- Centered illustration: empty shelf or open book
- Title: "No courses yet"
- Subtitle: "Create your first course to get started"
- CTA: "Create Course" button (primary)
- Displayed only when user has zero courses

### Loading State

- Skeleton cards: 6 placeholder cards with shimmer animation
- Same dimensions as real cards
- Thumbnail: gray-200 rectangle with shimmer
- Title: gray-200 line with shimmer
- Meta: 2 shorter gray-200 lines with shimmer
- Duration: 1.5 seconds shimmer cycle

### Error State

- Centered error illustration
- Title: "Something went wrong"
- Subtitle: "We couldn't load your courses. Please try again."
- "Retry" button (secondary)
- Error is logged to console + error reporting service

### Animations

- Page entrance: fade in (500ms ease-out)
- Cards: staggered entrance (each card fades in with 100ms delay, total 600ms)
- Filter change: cards fade out (200ms), grid updates, cards fade in (300ms)
- Hover on card: elevation transition 200ms ease, Y offset 200ms ease
- Kebab menu: fade + scale (150ms)
- Create course: draw slides from right, 300ms cubic-bezier

### Responsive

- Desktop (1400px+): 4-column grid
- Desktop (1200px): 3-column grid
- Tablet (768px): 2-column grid, search bar full width
- Mobile (<640px): 1-column grid, stacked layout, filters as horizontal scroll

### Accessibility

- All cards are focusable via Tab
- Enter or Space activates card (navigates to studio)
- Kebab menu: toggle via Enter, arrow keys to navigate items
- Search: auto-focus on "/" keypress
- Status badges have aria-label: "Status: Draft"
- Filter pills are radiogroup with role="tablist"
- Sort dropdown is a combobox

### Dark Mode

- Background: gray-950
- Card background: gray-900
- Card border: gray-800
- Text: gray-50 / gray-300 / gray-400
- Search background: gray-800
- Filter pills outline border: gray-700

### Light Mode

- Background: gray-50
- Card background: white
- Card border: gray-200
- Text: gray-900 / gray-700 / gray-500
- Search background: white
- Filter pills outline border: gray-300

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus between cards and controls |
| Shift+Tab | Reverse focus |
| Enter / Space | Activate focused card or button |
| / | Focus search bar |
| Escape | Close dropdown, clear search |
| Arrow keys | Navigate dropdown items within kebab |

---

# 9. COURSE STUDIO

## 9.1 Purpose

The Course Studio is the primary workspace where instructors build their entire course. It is a three-panel layout resembling a design tool (Figma, Notion, or video editor). The Left Navigator shows the course structure tree. The Center Workspace is where editing happens. The Right Inspector shows properties of the selected item.

## 9.2 Goals

- Provide a single-page workspace with zero full-page navigations during content building
- Enable rapid structural changes (reorder, add, delete) without leaving context
- Show the full course hierarchy at all times in the left panel
- Provide contextual editing via the Inspector Panel
- Support all 10 content types within the same workspace

## 9.3 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Top Header Bar]                                               │
│ ← Back | Course Title | [Draft] | Preview | Settings | Publish │
├────────┬────────────────────────────────┬──────────────────────┤
│        │                                │                       │
│ Left   │ Center Workspace               │ Right Inspector      │
│ Navig. │                                │ Panel                │
│ 280px  │ (flex: 1)                      │ 320px                │
│        │                                │                       │
│  [Col- │  ┌─ Lecture Builder ──┐        │  ┌─ Properties ──┐  │
│  laps- │  │                   │        │  │              │  │
│  able  │  │ Section Builder   │        │  │ (contextual) │  │
│  via   │  │                   │        │  │              │  │
│  drag  │  │ Content Items     │        │  │              │  │
│  or    │  │                   │        │  │              │  │
│  btn]  │  └───────────────────┘        │  └──────────────┘  │
│        │                                │                       │
│        │                                │                       │
│  Course│                                │  [Collapsible via    │
│  Tree  │                                │   drag or button]    │
│        │                                │                       │
├────────┴────────────────────────────────┴──────────────────────┤
│ [Status Bar] Lectures: 5 | Sections: 12 | Content: 28 | Unsaved│
└─────────────────────────────────────────────────────────────────┘
```

## 9.4 Panel Dimensions

| Panel | Default Width | Min Width | Max Width |
|-------|--------------|-----------|-----------|
| Left Navigator | 280px | 48px (collapsed icon-only) | 400px |
| Center Workspace | fluid (flex: 1) | 480px | fluid |
| Right Inspector | 320px | 0px (hidden) | 480px |

## 9.5 Resizable Panels

### Left Navigator Resize
- Drag handle on the right edge of Left Navigator
- Handle: 4px wide vertical bar, visible on hover
- Cursor: col-resize
- On drag: panel width updates in real-time
- On release: width is persisted to localStorage
- Snap points: 240px, 280px, 320px (optional snap with 50px proximity)

### Right Inspector Resize
- Drag handle on left edge of Inspector Panel
- Same behavior as Left Navigator
- Snap points: 280px, 320px, 400px

### Collapse Behavior

**Left Navigator:**
- Collapse button: chevron icon at top-right of panel
- Click: panel collapses to icon-only mode (48px wide)
- Icons only visible: course icon, lecture count, etc.
- Hover on collapsed panel: expands temporarily (peek) — 200ms delay
- Click collapsed panel: expands fully
- Keyboard: shortcut `Ctrl+B` toggles collapse

**Right Inspector:**
- Collapse button: X icon at top-left of panel
- Click: panel slides away, Center Workspace fills space
- When a content item is selected (from workspace, not tree), panel auto-opens
- Keyboard: shortcut `Ctrl+I` toggles collapse
- Auto-open behavior: when selecting any lecture, section, or content item

## 9.6 Left Navigator — Detailed Specification

### Structure

```
┌─ Course Studio ─────────────────┐
│  Search lectures... 🔍         │
│                                 │
│  ▶ Lecture 1 — Introduction    │
│    ├─ ■ Section 1 — Welcome    │
│    │  ├─ ● Video: Intro        │
│    │  ├─ ● PDF: Slides         │
│    │  └─ ● Resource: Code.zip  │
│    └─ ■ Section 2 — Setup      │
│       └─ ● Video: Install      │
│                                 │
│  ▶ Lecture 2 — Getting Started │
│  (expanded)                    │
│    ├─ ■ Section 1 — Basics     │
│    └─ ■ Section 2 — Advanced   │
│                                 │
│  ▶ Lecture 3 — Core Concepts   │
│  (collapsed, 2 sections hidden)│
│                                 │
│  ─────────────────────          │
│  + Add Lecture                  │
└─────────────────────────────────┘
```

### Icons per entity

| Entity | Icon | Icon component |
|--------|------|---------------|
| Course | BookOpen | lucide-react |
| Lecture | PlayCircle (if has content), FileText (if empty) | lucide-react |
| Section | LayoutPanelTop or Folder | lucide-react |
| Video | Video | lucide-react |
| PDF | FileText | lucide-react |
| Exam | ClipboardCheck | lucide-react |
| Assignment | Pencil | lucide-react |
| Resource | FolderArchive | lucide-react |
| Audio | Headphones | lucide-react |
| Live Session | Radio | lucide-react |
| External Link | Link | lucide-react |
| SCORM | Box | lucide-react |
| Certificate | Award | lucide-react |

### Tree Behavior

- Lectures: top-level items, always visible
- Sections: nested under lectures, indented by 16px
- Content items: nested under sections, indented by 32px
- Each level has left padding incrementing by 16px
- Lectures and sections have expand/collapse chevron
- Content items are leaf nodes (no expand)
- Active/selected item has highlighted background (primary-50 light, primary-950 dark)
- Drag handle (6-dot grid icon) on left of each item (lectures and sections only — content items also have drag handle)

### Drag and Drop in Tree

- Drag handle visible on hover
- Drag feedback: semi-transparent clone of item following cursor
- Drop zones: visual line indicator (2px colored line) showing where item will land
- Can reorder lectures (drag lecture up/down)
- Can move sections between lectures (drag section to different lecture)
- Can reorder content items within a section
- Cannot drag lectures into sections
- Cannot drag sections into content items
- Cannot drag content items outside their section
- Animation: items smoothly shift to accommodate drop position (spring animation, 300ms)

### Context Menu (Right-click on Tree Items)

- Edit
- Duplicate
- Delete
- Move Up / Move Down
- (Lecture only) Add Section
- (Section only) Add Content

## 9.7 Center Workspace — Detailed Specification

### States Overview

The Center Workspace displays different content based on what is selected in the tree:

| Selection | Workspace Content |
|-----------|------------------|
| Nothing selected (initial) | Welcome hero — "Select a lecture or add one to begin" |
| Lecture selected | Lecture Builder (see Chapter 10) |
| Section selected | Section Builder (see Chapter 11) |
| Content item selected | Content Builder (see Chapter 12) |
| Course header (top of tree) | Course Overview — course title, description, stats |

### Animated Transitions

- When selection changes between entity types, the workspace content transitions:
  - Fade out current content (150ms)
  - Scale down slightly (0.98x)
  - New content fades in + scale up (200ms, ease-out)
  - If same entity type (e.g., lecture A → lecture B): content slides horizontally (old slides left, new slides right from left), 250ms

### Empty States

**No Lecture Selected:**
- Centered layout
- Icon: GraduationCap (120px, muted)
- Title: "Course Studio"
- Subtitle: "Select a lecture from the left sidebar, or create your first lecture to begin building your course."
- CTA: "Create First Lecture" button (primary)

**Empty Lecture (no sections):**
- Title: "Lecture: [Lecture Name]"
- Subtitle: "This lecture has no sections yet."
- CTA: "Add Section" button
- Preview of what a section looks like: small illustration/miniature

**Empty Section (no content):**
- Title: "Section: [Section Name]"
- Subtitle: "This section is empty. Add your first content item."
- Content Picker Strip visible (see Chapter 13)

## 9.8 Right Inspector Panel — Detailed Specification

See Chapter 14 for full specification per selection type.

### General Behavior

- Panel slides in from right
- Has a header with the entity type icon + entity name
- "Close" button (X) in top-left corner
- Auto-opens when an entity is selected
- Remembers its collapsed/expanded state per session
- Content updates with the selected entity (no flash; smoothly transitions)
- If no entity is selected, shows: "Select an item to inspect"

### Inspector Content Transitions

When switching between entities:
- Current inspector content fades out (100ms)
- New content fades in (150ms)
- If switching between same entity type (e.g., content-to-content): crossfade only title/description with subtle morph animation

## 9.9 Status Bar

Fixed at bottom of Studio. Height: 36px. Background: gray-100 (light) / gray-900 (dark).

| Element | Position | Description |
|---------|----------|-------------|
| Lecture count | Left | "Lectures: 5" |
| Section count | Left | "Sections: 12" |
| Content count | Left | "Content items: 28" |
| Unsaved changes indicator | Right | "Unsaved changes" in amber, or "All changes saved" in green |
| Auto-save spinner | Right | Small spinning icon when saving |
| Last saved timestamp | Right | "Saved 2m ago" |

## 9.10 Auto-Save

- Every change triggers auto-save with 2-second debounce
- Indicator shows saving state
- Conflicts: if save fails, indicator turns red with error message
- Retry button appears on failure
- Manual "Save" button also available in header (Ctrl+S)

## 9.11 Responsive Behavior in Studio

**Desktop (1200px+):** Three-panel layout as described.

**Tablet (768px-1199px):**
- Left Navigator and Inspector Panel collapse by default
- Buttons to toggle them visible in header
- Workspace takes full width
- Inspector opens as overlay from right (over Center Workspace, 80% width max)

**Mobile (<768px):**
- Left Navigator: full-screen overlay from left, activated by hamburger button in header
- Inspector: bottom sheet that slides up, max 70% viewport height
- Workspace: full width, single column
- Drag-and-drop is disabled (replaced by Move Up / Move Down buttons)

---

# 10. LECTURE BUILDER

## 10.1 Purpose

The Lecture Builder is the view displayed in the Center Workspace when a lecture is selected in the tree. It shows the lecture's sections and enables management of the lecture itself.

## 10.2 Layout

```
┌─ Lecture Builder ────────────────────────────────────┐
│ [Lecture Header]                                     │
│  ≡  Lecture Title (click to edit inline)             │
│  [Draft]   Duration: 45m                             │
│  ────────────────────────────────────────────────    │
│  Lecture Description (optional, click to add/edit)   │
│                                                      │
│ [Sections List]                                      │
│                                                      │
│ ┌─ Section 1 ──────────────────────────────────────┐ │
│ │ ■ Section: Introduction                    [•••] │ │
│ │ Description text (optional, truncated to 2 lines)│ │
│ │ ───────────────────────────────────────────       │ │
│ │ Content items (4 items)                    [▶▶]  │ │
│ │ ● Video: Welcome                                   │ │
│ │ ● PDF: Course Overview                             │ │
│ │ ● Resource: Starter Files                         │ │
│ │ ▶ Show all 4 items                                 │ │
│ │                                              [+]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Section 2 ──────────────────────────────────────┐ │
│ │ ■ Section: Setup                           [•••] │ │
│ │ (empty section — click + to add content)    [+]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ────────────────────────────────────────────────     │
│ [+ Add Section]                                      │
└──────────────────────────────────────────────────────┘
```

## 10.3 Lecture Header

- Lecture title: editable inline (click to edit, input replaces text, on blur or Enter saves)
- Title font: 24px, bold
- Status badge: left of title
- Duration: right of status, gray text
- Description: editable textarea below title, collapsed by default (expand via "Add description")
- Drag handle (≡) on left: drag to reorder lecture

## 10.4 Section Cards

Each section is rendered as a card within the Lecture Builder.

### Card Structure
- Section icon + Title (editable inline)
- Section description (truncated to 2 lines), expandable
- Content preview strip: first 3 content items shown as small pills, with overflow count
- "Show all" link that expands inline content list
- Add Content button (+)
- Section drag handle (≡) on left edge of card
- Kebab menu (•••) on top-right of card

### Section Card Interactions
- Click on section title area: selects section in tree, opens Section Builder in workspace
- Click kebab: dropdown with Edit, Duplicate, Delete, Move Up, Move Down
- Hover on card: subtle border highlight (primary-200)
- Drag section cards to reorder within lecture

## 10.5 Creating a Lecture

### From Empty State (Course has no lectures)
- Large centered CTA: "Create Your First Lecture" button
- Click: inline form slides down from top of workspace
- Form fields:
  - Title (input, auto-focused)
  - Description (textarea, optional)
  - Duration (number input, optional)
- Buttons: "Add Lecture" (primary), "Cancel" (ghost)
- On submit: new lecture created, appears in tree, workspace transitions to Lecture Builder for new lecture

### From Existing Lecture View
- "Add Lecture" button at bottom of sections list (and in Left Navigator bottom)
- Same inline form behavior (form appears at top of workspace)
- Enter key submits when title field is focused

## 10.6 Editing a Lecture

### Inline Edit (in workspace header)
- Click title: becomes input field, auto-selects existing text
- Typing updates title
- Blur or Enter: save
- Escape: cancel edit, revert to original

### Via Inspector Panel
- Title field in Inspector Panel
- Description textarea in Inspector Panel
- Changes sync bidirectionally with workspace header

## 10.7 Duplicating a Lecture

- Click "Duplicate" from kebab menu or Inspector Panel
- Confirmation: none (treat as fast action) unless the lecture has no content, then a toast warns "Duplicated empty lecture"
- New lecture appears immediately below original
- Title appended with " (Copy)"
- All sections and content are deep-duplicated
- Status set to Draft
- Toast: "Lecture duplicated"
- Animation: new lecture slides into tree (300ms)

## 10.8 Deleting a Lecture

- Click "Delete" from kebab menu or Inspector Panel
- Confirmation modal appears:
  - Title: "Delete Lecture?"
  - Body: "This will permanently delete "[Lecture Name]" and all its sections and content. This action cannot be undone."
  - Buttons: "Cancel" (secondary), "Delete" (destructive/red)
- On confirm: lecture removed, animation (slide up + fade), workspace returns to course overview or selects next lecture
- Toast: "Lecture deleted"

## 10.9 Publishing a Lecture

- Toggle in Inspector Panel: "Published" / "Draft"
- Or via "Publish" context menu item
- Publishing requires: at least one section with content
- If no content: show tooltip "Add content before publishing"
- Published lecture has green Published badge

## 10.10 Archiving a Lecture

- Via kebab: "Archive"
- Confirmation: none
- Lecture moves to archived status (gray badge)
- Archived lectures appear at bottom of tree (separated by divider)
- Archived lectures can be unarchived
- Cannot add content to archived lectures (disabled state)

## 10.11 Reordering Lectures

- Drag handle in Left Navigator: drag up/down
- Drag handle in Lecture Builder header: drag card up/down
- Keyboard: Move Up / Move Down in kebab menu
- Realtime order update in tree with smooth animation
- New order persisted on drop

---

# 11. SECTION BUILDER

## 11.1 Purpose

The Section Builder is the view displayed in the Center Workspace when a section is selected in the tree. It provides a focused view of the section and its content items.

## 11.2 Layout

```
┌─ Section Builder ───────────────────────────────────┐
│ [Section Header]                                     │
│  ■ Section: [Title] (editable inline)          [•••] │
│  Part of Lecture: "Lecture Name"                     │
│  ────────────────────────────────────────────────    │
│  Description (editable textarea, optional)           │
│  Content count: 4 items                              │
│                                                      │
│ [Content Items List]                                 │
│                                                      │
│ ┌── Content Item ─────────────────────────────────┐ │
│ │ ≡ ● Video: Welcome Introduction          [•••]  │ │
│ │   Duration: 5:23 | Requires completion: Yes     │ │
│ │   (click to expand: shows full title, desc,    │ │
│ │    preview thumbnail for video, edit buttons)  │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Content Item ─────────────────────────────────┐ │
│ │ ≡ ■ PDF: Course Slides                   [•••]  │ │
│ │   Pages: 42 | Download allowed: Yes             │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Content Item ─────────────────────────────────┐ │
│ │ ≡ 🔗 External Link: Documentation        [•••]  │ │
│ │   url.com/docs                           │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ────────────────────────────────────────────────     │
│ [+ Add Content]  (opens Content Picker strip)       │
└──────────────────────────────────────────────────────┘
```

## 11.3 Section Header

- Section icon + title (editable inline, same behavior as lecture)
- Breadcrumb mini: "In Lecture: [Lecture Name]" — click navigates to lecture
- Kebab menu (•••)

## 11.4 Content Items in Section Builder

Each content item is rendered as a horizontal row.

### Row Structure
| Part | Description |
|------|-------------|
| ≡ | Drag handle (6-dot icon) |
| Content type icon | Colored icon based on type |
| Title | Editable inline (click to edit) |
| Quick meta | Type-specific one-liner (duration, pages, URL, etc.) |
| Status indicator | Small dot: green (published), gray (draft) |
| ••• | Kebab menu |

### Expanded State
- Click on row: expands to show full details inline
- Shows: description, settings toggles (require completion, allow skipping, free preview), edit button to open Inspector Panel
- Animated expand: height transition 200ms
- Click again or click another item: collapses

### Content Item Interactions
- Hover: background tint (gray-50 light, gray-800 dark)
- Drag: reorder within section
- Click kebab: Edit / Duplicate / Delete / Move Up / Move Down
- Double-click: opens Content Builder view (deep edit)

## 11.5 Creating a Section

- Click "Add Section" button in Lecture Builder or Left Navigator
- Inline form at top of sections list
- Fields: Title (required), Description (optional)
- On submit: new section added at end of list (or at position if specified)

## 11.6 Duplicating a Section

- Kebab → "Duplicate"
- Deep duplicates all content items
- Title appended with " (Copy)"
- Position: immediately below original
- Toast: "Section duplicated"

## 11.7 Deleting a Section

- Kebab → "Delete"
- Confirmation modal: "Delete Section? This will delete all content in this section."
- On confirm: section removed, content items cascade deleted
- Toast: "Section deleted"

## 11.8 Reordering Sections

- Drag handle in Left Navigator or within Lecture Builder
- Can drag sections between lectures (move section to different lecture)
- Drop zone visual indicator when dragging between lectures

---

# 12. CONTENT BUILDER

## 12.1 Purpose

The Content Builder is the view in the Center Workspace when a specific content item is selected. It provides a focused editing experience for that content type, including its type-specific controls.

## 12.2 General Layout (All Content Types)

```
┌─ Content Builder ───────────────────────────────────┐
│ [Content Header]                                     │
│  ● [Content Type Icon] [Content Type Name]           │
│  Title: [editable inline]                            │
│  In Section: "Section Name" > Lecture: "Lecture"     │
│  ────────────────────────────────────────────────    │
│                                                      │
│ [Content Preview / Editor Area]                      │
│  (type-specific, see below)                          │
│                                                      │
│ [Content Settings]                                   │
│  Description (textarea)                              │
│  Require completion (toggle)                         │
│  Allow skipping (toggle, video only)                 │
│  Free preview (toggle)                               │
│                                                      │
│ [Actions]                                            │
│  [Delete Content] [Duplicate Content]               │
└──────────────────────────────────────────────────────┘
```

## 12.3 Video Content Builder

```
┌─ Video Content ─────────────────────────────────────┐
│ [Header] Video: "Welcome Introduction"              │
│                                                      │
│ [Preview Area]                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │     [Video thumbnail with play button]         │ │
│  │     Filename: welcome_intro.mp4                │ │
│  │     Size: 124 MB | Duration: 5:23             │ │
│  │     Resolution: 1920x1080                      │ │
│  │                                                │ │
│  │     [Replace Video] [Delete Video]             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│ [Settings]                                           │
│  Title override: [________________________]         │
│  Description: [textarea]                             │
│  ◻ Require 100% completion                          │
│  ◻ Allow skipping                                   │
│  ◻ Make free preview                                │
│  Captions: [No captions] [Upload .vtt]              │
└──────────────────────────────────────────────────────┘
```

## 12.4 PDF Content Builder

```
┌─ PDF Content ───────────────────────────────────────┐
│ [Header] PDF: "Course Slides"                        │
│                                                      │
│ [Preview Area]                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │  [PDF icon large]                              │ │
│  │  course_slides.pdf | 42 pages | 8.2 MB        │ │
│  │  [Download Preview] [View Full Screen]        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│ [Settings]                                           │
│  Title override: [________________________]         │
│  Description: [textarea]                             │
│  ◻ Allow download                                   │
│  ◻ Require completion (must scroll to end)          │
│  ◻ Make free preview                                │
└──────────────────────────────────────────────────────┘
```

## 12.5 Exam Content Builder

```
┌─ Exam Content ──────────────────────────────────────┐
│ [Header] Exam: "Midterm Quiz"                        │
│                                                      │
│ [Exam Info]                                          │
│  Source: Exam Bank                                   │
│  Questions: 25 | Time limit: 30 min                 │
│  Passing score: 70% | Attempts: 2                   │
│                                                      │
│  [Select from Exam Bank] [Create New Exam]          │
│                                                      │
│ [Settings]                                           │
│  Title override: [________________________]         │
│  Instructions: [textarea]                           │
│  Time limit (minutes): [____]                       │
│  Passing score (%): [____]                          │
│  Attempts allowed: [dropdown: 1-10, Unlimited]     │
│  ◻ Shuffle questions                                │
│  ◻ Show results immediately                         │
│  ◻ Require passing score to continue                │
│  ◻ Make free preview                                │
└──────────────────────────────────────────────────────┘
```

## 12.6 Assignment Content Builder

```
┌─ Assignment Content ────────────────────────────────┐
│ [Header] Assignment: "Week 1 Homework"               │
│                                                      │
│ [Content Area]                                       │
│  Instructions: [rich textarea — basic formatting]   │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Max score: [____]                                  │
│  Due date: [date picker]                            │
│  Submission type: [File] [Text] [Both]              │
│  ◻ Allow late submission                            │
│  Late penalty: [____] % per day                     │
│  ◻ Require submission to continue                   │
└──────────────────────────────────────────────────────┘
```

## 12.7 Resource Content Builder

```
┌─ Resource Content ──────────────────────────────────┐
│ [Header] Resource: "Starter Code"                    │
│                                                      │
│ [File Info]                                          │
│  starter-code.zip | 2.4 MB                          │
│  [Replace File] [Download]                          │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
│  ◻ Allow download                                   │
└──────────────────────────────────────────────────────┘
```

## 12.8 Audio Content Builder

```
┌─ Audio Content ─────────────────────────────────────┐
│ [Header] Audio: "Lecture Recording"                  │
│                                                      │
│ [Audio Player Preview]                               │
│  ┌───────▶───────────────────────────────────────┐  │
│  │ ▶  ████████░░░░░░░░░░  0:32 / 15:20          │  │
│  └───────────────────────────────────────────────┘  │
│  lecture_recording.mp3 | 14.2 MB                   │
│  [Replace Audio]                                    │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
│  ◻ Require completion (must listen to end)          │
│  ◻ Make free preview                                │
└──────────────────────────────────────────────────────┘
```

## 12.9 Live Session Content Builder

```
┌─ Live Session Content ──────────────────────────────┐
│ [Header] Live Session: "Office Hours Week 2"         │
│                                                      │
│ [Session Info]                                       │
│  Provider: [Zoom ▼] [Google Meet] [Teams] [Custom] │
│  Meeting URL/ID: [________________________]         │
│  Scheduled date: [date picker]                      │
│  Scheduled time: [time picker]                      │
│  Duration: [____] minutes                           │
│                                                      │
│ [Recording] (optional)                               │
│  Recording URL: [________________________]          │
│  ◻ Recording available to students                   │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
└──────────────────────────────────────────────────────┘
```

## 12.10 External Link Content Builder

```
┌─ External Link Content ─────────────────────────────┐
│ [Header] Link: "Documentation Reference"             │
│                                                      │
│ [Link Info]                                          │
│  URL: [https://________________________]            │
│  [Test Link] [Open in new tab]                      │
│  Preview: [link preview card with favicon]          │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
│  ◻ Open in new tab                                  │
│  ◻ Make free preview                                │
└──────────────────────────────────────────────────────┘
```

## 12.11 SCORM Content Builder

```
┌─ SCORM Content ─────────────────────────────────────┐
│ [Header] SCORM Package: "Interactive Module 1"      │
│                                                      │
│ [Package Info]                                       │
│  File: module1.zip | 15.3 MB                        │
│  Version: SCORM 1.2                                 │
│  [Replace Package] [Test Launch]                    │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
│  Completion threshold: [____] %                     │
│  ◻ Require completion                               │
│  ◻ Make free preview                                │
└──────────────────────────────────────────────────────┘
```

## 12.12 Certificate Content Builder

```
┌─ Certificate Content ───────────────────────────────┐
│ [Header] Certificate: "Course Completion"            │
│                                                      │
│ [Certificate Info]                                   │
│  Template: [Select Template ▼]                      │
│  Preview: [certificate preview thumbnail]           │
│  [Manage Templates] (opens template manager)        │
│                                                      │
│ [Settings]                                           │
│  Title: [________________________]                  │
│  Description: [textarea]                            │
│  Issuing requirements:                              │
│  ◻ Complete all lectures                            │
│  ◻ Pass all exams                                   │
│  ◻ Submit all assignments                           │
│  ◻ Auto-issue certificate on completion             │
└──────────────────────────────────────────────────────┘
```

---

# 13. CONTENT PICKER

## 13.1 Purpose

The Content Picker is a horizontal strip of clickable content type icons. It appears when the user clicks "Add Content" in a section. It is the gateway to adding any of the 10 content types.

## 13.2 States

### Visible State

```
┌─ Add Content ───────────────────────────────────────┐
│                                                      │
│  [🎬]  [📄]  [📝]  [✏️]  [📁]  [🎧]  [📡]  [🔗]  [📦]  [🏆] │
│  Video  PDF   Exam  Assgn Resrc Audio Live  Link  SCORM Cert│
│                                                      │
│  [Upload from computer]        [Browse Media Library]│
│                                                      │
└──────────────────────────────────────────────────────┘
```

Each type is shown as a vertical icon + label pill.

### Hover State
- Pill background tints with the type's brand color
- Tooltip shows "Add [Content Type]"
- Slight scale up (1.05x)

### Click Behavior
- Clicking a type triggers the appropriate content creation flow:
  - **Video, PDF, Audio, Resource, SCORM:** Opens file uploader (native or drag-drop zone)
  - **Exam:** Opens Exam Bank browser or new exam creator
  - **Assignment:** Opens Assignment form inline
  - **Live Session:** Opens Live Session form inline
  - **External Link:** Opens URL input inline
  - **Certificate:** Opens certificate template selector

### After Selection
- Content Picker collapses
- New content item appears at bottom of section content list
- If the content type requires a file upload, the uploader remains visible until upload completes

## 13.3 Content Type Card Icons & Colors

| Content Type | Icon | Color (Light) | Color (Dark) |
|-------------|------|---------------|--------------|
| Video | Film | blue-600 | blue-400 |
| PDF | FileText | red-600 | red-400 |
| Exam | ClipboardCheck | purple-600 | purple-400 |
| Assignment | Pencil | orange-600 | orange-400 |
| Resource | FolderArchive | green-600 | green-400 |
| Audio | Headphones | indigo-600 | indigo-400 |
| Live Session | Radio | pink-600 | pink-400 |
| External Link | Link | cyan-600 | cyan-400 |
| SCORM | Box | yellow-600 | yellow-400 |
| Certificate | Award | emerald-600 | emerald-400 |

## 13.4 Empty State

If no content types are enabled for the tenant:
- "No content types have been enabled for your organization. Contact your admin."

---

# 14. INSPECTOR PANEL

## 14.1 General Behavior

The Inspector Panel appears on the right side of the Course Studio. It shows contextual properties for the currently selected entity (Lecture, Section, or Content Item). The content of the panel changes entirely based on the selection type.

**Common Elements (every view):**
- Header with entity type icon + entity name (truncated)
- Close button (X) top-left
- Section dividers with subtle borders
- Save buttons inline (no separate save action — auto-save)

## 14.2 Inspector: No Selection

```
┌─ Inspector ─────────────────────┐
│ [×]                             │
│                                 │
│           [eye icon]            │
│     Select an item to inspect   │
│                                 │
│   Click on any lecture, section │
│   or content item to see its    │
│   properties here.              │
│                                 │
└─────────────────────────────────┘
```

## 14.3 Inspector: Course (when course root selected in tree)

```
┌─ Course Properties ─────────────┐
│ [×] Course: "Course Title"      │
│ ──────────────────────────────  │
│ Status: [Draft ▼]               │
│ Created: Jan 15, 2026           │
│ Updated: 2 hours ago            │
│                                 │
│ ── Statistics ──                │
│ Lectures:  5                    │
│ Sections:  12                   │
│ Content:  28                    │
│ Duration:  3h 45m              │
│                                 │
│ ── Quick Actions ──             │
│ [Edit Course Settings]          │
│ [Preview Course]                │
│ [Duplicate Course]              │
│ [Delete Course]                 │
└─────────────────────────────────┘
```

## 14.4 Inspector: Lecture

```
┌─ Lecture Properties ────────────┐
│ [×] ▶  Lecture: "Introduction" │
│ ──────────────────────────────  │
│ Status: [Draft ▼]               │
│ Order: 1 of 5                   │
│ Created: Jan 15, 2026           │
│                                 │
│ ── Title ──                     │
│ [Introduction                   ]│
│                                 │
│ ── Description ──               │
│ [In this lecture, we will...    ]│
│ [textarea, 3 rows]              │
│                                 │
│ ── Duration ──                  │
│ Estimated: [45] minutes         │
│ (Auto-calculated: 42m)         │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete] [Archive] │
└─────────────────────────────────┘
```

## 14.5 Inspector: Section

```
┌─ Section Properties ────────────┐
│ [×] ■  Section: "Welcome"      │
│ ──────────────────────────────  │
│ Part of: Lecture "Introduction" │
│ Order: 1 of 2                   │
│ Content items: 4               │
│                                 │
│ ── Title ──                     │
│ [Welcome                        ]│
│                                 │
│ ── Description ──               │
│ [In this section...             ]│
│ [textarea, 3 rows]              │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
│ [Move to Lecture...] (dropdown) │
└─────────────────────────────────┘
```

## 14.6 Inspector: Video Content

```
┌─ Video Properties ──────────────┐
│ [×] ●  Video: "Intro"          │
│ ──────────────────────────────  │
│ In: Section "Welcome"           │
│ Status: [Draft]                 │
│                                 │
│ ── Preview ──                   │
│ ┌──────────────────────────┐   │
│ │ [Thumbnail image]        │   │
│ └──────────────────────────┘   │
│ welcome_intro.mp4              │
│ Duration: 5:23 | 124 MB       │
│ [Replace Video]                │
│                                 │
│ ── Title Override ──           │
│ [Welcome Introduction          ]│
│                                 │
│ ── Description ──              │
│ [In this video...              ]│
│ [textarea, 3 rows]             │
│                                 │
│ ── Settings ──                  │
│ ◻ Require 100% completion      │
│ ◻ Allow skipping               │
│ ◻ Make free preview            │
│                                 │
│ ── Captions ──                  │
│ [No captions] [Upload .vtt]    │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.7 Inspector: PDF Content

```
┌─ PDF Properties ────────────────┐
│ [×] ■  PDF: "Slides"           │
│ ──────────────────────────────  │
│ In: Section "Welcome"           │
│                                 │
│ ── File Info ──                 │
│ course_slides.pdf              │
│ 42 pages | 8.2 MB             │
│ [Replace File]                  │
│                                 │
│ ── Title Override ──           │
│ [Course Slides                  ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ ◻ Allow download                │
│ ◻ Require scroll to end        │
│ ◻ Make free preview            │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.8 Inspector: Exam Content

```
┌─ Exam Properties ───────────────┐
│ [×] 📝  Exam: "Quiz 1"         │
│ ──────────────────────────────  │
│ In: Section "Assessment"        │
│                                 │
│ ── Exam Source ──               │
│ From: Exam Bank                 │
│ Questions: 25                   │
│ [Change Exam]                   │
│                                 │
│ ── Title ──                     │
│ [Quiz 1 - Fundamentals          ]│
│                                 │
│ ── Instructions ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ Time limit: [30] minutes        │
│ Passing score: [70] %           │
│ Attempts: [2] ▼                 │
│ ◻ Shuffle questions             │
│ ◻ Show results immediately      │
│ ◻ Require passing score        │
│ ◻ Make free preview            │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.9 Inspector: Assignment Content

```
┌─ Assignment Properties ────────┐
│ [×] ✏️  Assignment: "HW1"     │
│ ──────────────────────────────  │
│ In: Section "Practice"          │
│                                 │
│ ── Title ──                     │
│ [Week 1 Homework                ]│
│                                 │
│ ── Instructions ──             │
│ [Rich textarea — basic HTML]   │
│                                 │
│ ── Settings ──                  │
│ Max score: [100]                │
│ Due date: [📅 Feb 20, 2026]    │
│ Submission type: [File ▼]      │
│ ◻ Allow late submission         │
│ Late penalty: [10] % per day   │
│ ◻ Require submission to pass   │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.10 Inspector: Resource Content

```
┌─ Resource Properties ───────────┐
│ [×] 📁  Resource: "Code"       │
│ ──────────────────────────────  │
│ In: Section "Setup"             │
│                                 │
│ ── File Info ──                 │
│ starter-code.zip | 2.4 MB      │
│ [Replace File]                  │
│                                 │
│ ── Title ──                     │
│ [Starter Project Files          ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ ◻ Allow download                │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.11 Inspector: Audio Content

```
┌─ Audio Properties ──────────────┐
│ [×] 🎧  Audio: "Lecture"       │
│ ──────────────────────────────  │
│ In: Section "Resources"         │
│                                 │
│ ── Audio Info ──                │
│ lecture_recording.mp3          │
│ Duration: 15:20 | 14.2 MB     │
│ [Replace Audio]                 │
│                                 │
│ ── Title ──                     │
│ [Lecture Recording              ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ ◻ Require listen to end        │
│ ◻ Make free preview            │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.12 Inspector: Live Session Content

```
┌─ Live Session Properties ──────┐
│ [×] 📡  Live: "Office Hours"   │
│ ──────────────────────────────  │
│ In: Section "Week 2"            │
│                                 │
│ ── Meeting Details ──           │
│ Provider: [Zoom ▼]             │
│ URL: [https://zoom.us/j/...   ]│
│ Scheduled: 📅 Feb 15, 2026    │
│ Time: [02:00 PM] [60] min     │
│                                 │
│ ── Recording ──                 │
│ URL: [________________________]│
│ ◻ Available to students         │
│                                 │
│ ── Title ──                     │
│ [Office Hours Week 2            ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.13 Inspector: External Link Content

```
┌─ Link Properties ───────────────┐
│ [×] 🔗  Link: "Docs"           │
│ ──────────────────────────────  │
│ In: Section "References"        │
│                                 │
│ ── Link ──                      │
│ URL: [https://docs.example... ]│
│ [Test Link]                     │
│                                 │
│ ── Title ──                     │
│ [Documentation Reference        ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ ◻ Open in new tab              │
│ ◻ Make free preview            │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.14 Inspector: SCORM Content

```
┌─ SCORM Properties ──────────────┐
│ [×] 📦  SCORM: "Module 1"      │
│ ──────────────────────────────  │
│ In: Section "Interactive"        │
│                                 │
│ ── Package Info ──              │
│ module1.zip | 15.3 MB          │
│ Version: SCORM 1.2             │
│ [Replace Package] [Test Launch]│
│                                 │
│ ── Title ──                     │
│ [Interactive Module 1           ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Settings ──                  │
│ Completion threshold: [80] %   │
│ ◻ Require completion            │
│ ◻ Make free preview            │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

## 14.15 Inspector: Certificate Content

```
┌─ Certificate Properties ───────┐
│ [×] 🏆  Cert: "Completion"     │
│ ──────────────────────────────  │
│ In: Section "Final"             │
│                                 │
│ ── Template ──                  │
│ [Course Completion ▼]          │
│ [Preview Certificate]           │
│ [Manage Templates]              │
│                                 │
│ ── Title ──                     │
│ [Certificate of Completion      ]│
│                                 │
│ ── Description ──              │
│ [textarea]                      │
│                                 │
│ ── Requirements ──              │
│ ◻ Complete all lectures         │
│ ◻ Pass all exams (≥70%)       │
│ ◻ Submit all assignments       │
│ ◻ Auto-issue on completion     │
│                                 │
│ ── Actions ──                   │
│ [Duplicate] [Delete]           │
└─────────────────────────────────┘
```

---

# 15. PUBLISHING EXPERIENCE

## 15.1 Purpose

The Publishing Experience is a guided workflow that ensures a course is complete and ready for student consumption before going live. It validates content, shows warnings, and prevents publishing if critical items are missing.

## 15.2 Entry Points

- "Publish" button in Course Studio header (always visible)
- "Publish" in course kebab menu on Courses Home
- Keyboard shortcut: `Ctrl+Shift+P`

## 15.3 Publishing Checklist Drawer

### Layout

The checklist appears as an overlay drawer on the right side of the Studio (replaces/sits on top of the Inspector Panel).

```
┌─ Publishing Checklist ─────────┐
│ [×]                            │
│                                │
│ 🚀  Ready to Publish?         │
│                                │
│ Progress: ████████░░ 80%      │
│ 8 of 10 items passed          │
│                                │
│ ── Required ──                 │
│ ✅ Course has a title          │
│ ✅ Course has a category       │
│ ✅ At least 1 lecture exists   │
│ ✅ All lectures have sections  │
│ ❌ Lecture 2 has no sections   │
│ ✅ All sections have content   │
│ ✅ All content has valid src   │
│                                │
│ ── Recommended ──              │
│ ⚠️ No course thumbnail         │
│ ⚠️ No course description       │
│ ⚠️ No price set                │
│                                │
│ ── Info ──                     │
│ ℹ️ Course has 5 lectures       │
│ ℹ️ Course has 12 sections      │
│ ℹ️ Course has 28 content items │
│                                │
│ [Publish Now] [Cancel]         │
└─────────────────────────────────┘
```

### Checklist Items (Complete List)

**Required (blocking):**
- Course has a title
- Course has a category assigned
- At least one lecture exists
- All lectures have at least one section
- All sections have at least one content item
- All content items have valid source data (file uploaded, URL valid, etc.)
- No content items are in "uploading" or "failed" state

**Recommended (non-blocking, warnings):**
- Course has a thumbnail
- Course has a description
- Course has a price set (if paid)
- At least one lecture is marked as free preview
- No lectures are empty
- All content items have descriptions
- All content items have titles (not using default)
- Course has tags

**Informational:**
- Lecture count
- Section count
- Content item count
- Total duration
- Estimated student time

### Validation (Blocking)

If any required item fails, the "Publish Now" button is disabled and shows:
- "Fix [n] issues to publish" (tooltip on disabled button)
- Clicking the failed item scrolls/focuses to the relevant section

### Progress Bar

- Animated gradient fill
- Percentage: (passed items / total items) × 100
- Color: red (< 60%), amber (60-99%), green (100%)
- Smooth animation on check/uncheck

### Publishing Action

- Click "Publish Now"
- Loading state: spinner on button, button text: "Publishing..."
- On success:
  - Drawer auto-closes (300ms delay)
  - Confetti animation bursts from cursor position
  - Toast: "Course published successfully!" (green, persistent 5s)
  - Course status badge updates to "Published" (green)
  - Share button appears in header
- On failure:
  - Toast: "Publishing failed. Please try again."
  - Specific error message if known: "Failed to process video: [filename]"
  - "Retry" button

### Draft to Published State Change

- Course status transitions from "Draft" to "Published"
- All lectures set to "Published" (if not already)
- Published timestamp recorded
- Course becomes visible to students
- Student-facing URL generated (if not already)

### Unpublishing

- "Unpublish" button in header (replaces "Publish" when course is published)
- Confirmation modal: "Unpublish Course? Students will lose access immediately."
- On confirm: course returns to Draft state
- Lectures remain published (but inaccessible)
- Toast: "Course unpublished"

---

# 16. STUDENTS

## 16.1 Purpose

The Students section within Course Studio allows instructors to manage enrollment, view student progress, and communicate with students.

## 16.2 Screen: Student Management

Route: `/courses/{id}/studio/students`
Tab in Studio.

### Layout

```
┌─ Students ──────────────────────────────────────────┐
│ [Header] Students (42 enrolled)                     │
│                                                     │
│ [Search + Filters]                                   │
│  🔍 Search students...    [All] [Active] [Inactive] │
│                                                     │
│ [Student List]                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Avatar  John Doe          john@email.com  85%  │ │
│ │ Avatar  Jane Smith        jane@email.com  92%  │ │
│ │ Avatar  Bob Wilson        bob@email.com   45%  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Actions]                                            │
│ [+ Enroll Student] [Export CSV] [Send Email]       │
└─────────────────────────────────────────────────────┘
```

### Student Row

| Element | Description |
|---------|-------------|
| Avatar | 32px, circular, first letter or profile image |
| Name | 14px, semibold |
| Email | 12px, gray-500 |
| Progress bar | Thin bar showing % complete across all lectures |
| Percentage | 14px, numeric value |
| Kebab | View profile, Remove enrollment, Send message |

### Enroll Student

- Modal with email input
- Enroll by email (sends invitation if user exists)
- Enroll by CSV upload (bulk)
- Success: toast "Student enrolled"
- Error: "User not found" or "Already enrolled"

### Student Detail (click row)

- Drawer from right (overlays list)
- Shows: name, email, enrolled date, last access
- Per-lecture progress breakdown
- Per-content completion status
- Option to manually mark content as complete
- Option to remove enrollment

### Permissions

- Instructor: full access to students enrolled in own course
- TA: view-only access to student list and progress (no enrollment management)
- Admin: full access to all students across tenant

---

# 17. ANALYTICS

## 17.1 Purpose

The Analytics section provides data-driven insights about course performance, student engagement, and content effectiveness.

## 17.2 Screen: Course Analytics

Route: `/courses/{id}/studio/analytics`
Tab in Studio.

### Layout

```
┌─ Analytics ─────────────────────────────────────────┐
│ [Header] Analytics                                  │
│                                                     │
│ [Time Period Selector]                              │
│ [Last 7 days] [Last 30 days] [Last 90 days] [All]  │
│                                                     │
│ [Key Metrics Row]                                   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │ 1,245 │ │ 892  │ │ 68%  │ │ 4.7  │               │
│ │Total  ││Active ││Comp.  ││Rating │               │
│ │Enroll ││Stud. ││Rate   ││/5.0  │               │
│ └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                     │
│ [Enrollment Chart]                                  │
│  Line chart: enrollments over time                  │
│                                                     │
│ [Completion Funnel]                                 │
│  Funnel chart: enrolled → started → 50% → 100%    │
│                                                     │
│ [Lecture Performance]                               │
│  Bar chart: completion rate per lecture             │
│                                                     │
│ [Content Engagement]                                │
│  Table: content item → views → avg time → completion│
│                                                     │
│ [Export]                                             │
│ [Download CSV] [Download PDF Report]               │
└─────────────────────────────────────────────────────┘
```

### Key Metrics Cards

| Metric | Description | Icon |
|--------|-------------|------|
| Total Enrollments | All-time enrollments | Users |
| Active Students | Students with activity in selected period | Activity |
| Completion Rate | % who completed 100% of content | CheckCircle |
| Average Rating | Student rating (if ratings enabled) | Star |
| Revenue | Total revenue (if paid course) | DollarSign |

### Charts

**Enrollment Chart:**
- Line chart, x-axis: time (days), y-axis: cumulative enrollments
- Smooth curved lines
- Tooltip on hover: date + value
- Gradient fill below line

**Completion Funnel:**
- Funnel: Enrolled → Started → 50% Complete → 100% Complete
- Each stage shows count and percentage drop-off
- Color gradient from top (green) to bottom (amber)

**Lecture Performance:**
- Horizontal bar chart: each lecture as a bar
- Bar length = completion rate %
- Color: green (≥80%), amber (50-79%), red (<50%)
- Sorted by completion rate ascending

**Content Engagement Table:**
| Content | Type | Views | Avg Time | Completion | 
|---------|------|-------|----------|------------|
| Welcome Video | 🎬 Video | 1,024 | 4:32 | 92% |
| Quiz 1 | 📝 Exam | 892 | 12:15 | 78% |

### Permissions

- Instructor: full analytics for own course
- TA: no access to analytics
- Admin: full access across tenant

---

# 18. SEO

## 18.1 Purpose

SEO metadata for each course to improve discoverability in search engines and social sharing.

## 18.2 Implementation

SEO fields are managed in Course Settings (Chapter 19).

### Per-Course SEO Fields

| Field | Max Length | Description |
|-------|-----------|-------------|
| Meta Title | 60 chars | If empty, uses course title |
| Meta Description | 160 chars | If empty, uses course description |
| OG Image URL | — | If empty, uses course thumbnail |
| OG Title | — | Falls back to meta title |
| OG Description | — | Falls back to meta description |
| Canonical URL | — | Auto-generated from course slug |

### Auto-Generated Metadata

| Property | Value |
|----------|-------|
| Schema.org Type | Course |
| Schema.org Name | Course title |
| Schema.org Description | Course description |
| Schema.org Provider | Platform name |
| Schema.org Image | Course thumbnail |
| Schema.org DatePublished | Published date |
| Schema.org Duration | PT{x}H{x}M format |

### Social Sharing

- Open Graph tags for Facebook/LinkedIn
- Twitter Card tags (summary_large_image)
- Full preview in link sharing

---

# 19. SETTINGS

## 19.1 Purpose

Course Settings is a form-based tab within Course Studio for configuring all course-level metadata, pricing, and behavior.

## 19.2 Layout

Tab within Studio. Not a full-page navigation.

```
┌─ Course Settings ───────────────────────────────────┐
│ [Header] Course Settings                            │
│                                                     │
│ ── Basic Information ──                             │
│ Title: [________________________]                  │
│ Subtitle: [________________________]               │
│ Description: [rich textarea, 6 rows]               │
│ Category: [Select ▼]                               │
│ Tags: [tag1] [tag2] [tag3] [+ Add Tag]            │
│ Language: [English ▼]                              │
│ Difficulty: [All Levels ▼]                         │
│                                                     │
│ ── Media ──                                         │
│ Thumbnail: [📁 Upload] [Preview thumbnail]         │
│   Recommended: 1280×720px, JPG/PNG, < 2MB         │
│ Cover Image: [📁 Upload] [Preview cover]           │
│   Recommended: 1920×480px, JPG/PNG, < 5MB         │
│                                                     │
│ ── Pricing ──                                       │
│ Course type: [Free] [Paid]                         │
│ Price: [$][__________]                             │
│ Sale price: [$][__________] (optional)             │
│ Currency: [USD ▼]                                  │
│                                                     │
│ ── SEO ── (collapsible)                             │
│ Meta Title: [________________________]             │
│ Meta Description: [________________________]       │
│ OG Image: [📁 Upload]                              │
│ [Generate from course info]                        │
│                                                     │
│ ── Access ──                                        │
│ Enrollment: [Open] [Approval Required] [Closed]    │
│ Max students: [__________] (leave empty for ∞)    │
│ Course access: [Lifetime] [Time-limited]           │
│ Access duration: [____] days (if time-limited)    │
│                                                     │
│ ── Danger Zone ──                                   │
│ [Delete Course] (red button, confirmation modal)   │
│                                                     │
│ [Save Changes] [Cancel]                             │
└─────────────────────────────────────────────────────┘
```

## 19.3 Saving

- Changes are auto-saved on field blur (2s debounce)
- "Save Changes" button for manual save
- "Cancel" reverts unsaved changes
- Unsaved indicator: dot on Settings tab label

## 19.4 Danger Zone: Delete Course

- Red outlined destructive button
- Confirmation modal: 
  - Title: "Delete Course?"
  - Body: "This will permanently delete "[Course Title]" and all associated data. Students will lose access. This action cannot be undone."
  - Input field: "Type DELETE to confirm"
  - Buttons: "Cancel", "Delete Course" (disabled until "DELETE" typed)
- On confirm: course deleted, redirect to `/courses`
- Toast: "Course deleted"

---

# 20. MICRO INTERACTIONS

## 20.1 Hover States

| Element | Hover Effect | Duration | Easing |
|---------|-------------|----------|--------|
| Course card | Elevate shadow +0.2, translateY(-2px) | 200ms | ease-out |
| Button (primary) | Brightness 1.1, slight scale(1.02) | 150ms | ease-out |
| Button (ghost) | Background fill (gray-100 light, gray-800 dark) | 150ms | ease-out |
| Tree item | Background tint (gray-50 light, gray-800 dark) | 100ms | ease-out |
| Close button | Rotate 90deg, color shift | 200ms | spring |
| Drag handle | Opacity 0.4 → 1.0 | 150ms | ease-out |
| Content type pill | Scale(1.05), stronger shadow | 200ms | spring |
| Breadcrumb link | Underline + color shift | 150ms | ease-out |
| Tab | Background fill extends | 150ms | ease-out |
| Icon button | Background circle fill | 150ms | ease-out |

## 20.2 Focus States

| Element | Focus Ring |
|---------|-----------|
| Input | 2px solid primary-500, offset 2px |
| Button | 2px solid primary-500, offset 2px |
| Card | 2px solid primary-300, inset |
| Link | Underline style |
| Textarea | 2px solid primary-500 |
| Select | 2px solid primary-500 |
| Toggle | 2px solid primary-500 |

## 20.3 Click / Press States

| Element | Press Effect |
|---------|-------------|
| Button | Scale(0.97), brightness 0.95 |
| Card | Scale(0.99), brief flash |
| Toggle switch | Smooth slide with spring |
| Checkbox | Checkmark animation (scale in) |
| Radio | Dot expand animation |

## 20.4 Transitions

| Transition | Properties | Duration | Easing |
|-----------|-----------|----------|--------|
| Page enter | opacity, translateY(10px→0) | 400ms | ease-out |
| Drawer open | translateX(100%→0), opacity | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Drawer close | translateX(0→100%), opacity | 250ms | ease-in |
| Modal open | opacity, scale(0.95→1) | 200ms | ease-out |
| Modal close | opacity, scale(1→0.95) | 150ms | ease-in |
| Panel collapse | width from N→48px | 250ms | ease-in-out |
| Inspector slide | translateX | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Breadcrumb update | fade out/in | 200ms | ease |
| Tab switch | content crossfade | 200ms | ease |
| Reorder items | translateY (FLIP technique) | 300ms | spring(damping: 25) |
| New item appear | scale(0.8→1), opacity | 250ms | spring |
| Delete item | scale(1→0.8), opacity | 200ms | ease-in |
| Drag over | horizontal line scaleX(0→1) | 150ms | ease-out |
| Toast enter | translateY(20px→0), opacity | 250ms | ease-out |
| Toast exit | translateY(0→-20px), opacity | 200ms | ease-in |
| Accordion expand | max-height, opacity | 250ms | ease-in-out |
| Skeleton shimmer | translateX(-100%→100%) | 1.5s | linear (infinite) |

## 20.5 Loading Skeletons

### Course Card Skeleton
```
┌──────────────────────────────┐
│ ████████████████████████████ │  (140px height, gray-200 shimmer)
│                              │
├──────────────────────────────┤
│ ████████████████             │  (title line)
│ ████████                     │  (subtitle line)
│ ██████████████████           │  (meta line)
└──────────────────────────────┘
```

### Course Studio Tree Skeleton
```
█  ██████████████████
█  ████████████
█  ████████    ████████
█  ██████████████████
█  ████████████
█  ████████    ████████
```

### Content Row Skeleton
```
≡ ███  ████████████████████████    ██████████
≡ ███  ████████████████████████    ██████████
≡ ███  ████████████████████████    ██████████
```

### Inspector Skeleton
```
×  ██████████████
─────────────────
████████████████
████████████████

██  ██████████
██  ██████████

████████
████████
```

## 20.6 Confetti Animation

- Triggered on successful publish
- Confetti particles burst from cursor/relevant button position
- 200 particles, randomized colors (primary palette + accent)
- Physics: gravity, slight wind, rotation
- Duration: 3 seconds
- Fade out over final 0.5s

## 20.7 Drag and Drop Animations

- Drag start: opacity 0.8, slight scale(1.02), cursor grabbing
- Drag move: item follows cursor with offset
- Drop zone indicator: 2px line with primary-500 color, animated scaleX(0→1)
- Drop success: item slides to new position (FLIP animation), 300ms spring
- Drop invalid: item bounces back to original position (200ms spring)
- Drag handle visible on hover: fade in 150ms

## 20.8 Scroll Animations

- Smooth scrolling for long section content lists
- Scrollbar: thin, styled (scrollbar-width: thin)
- Auto-scroll to new item when added

---

# 21. DESIGN SYSTEM

## 21.1 Typography

### Font Stack

| Usage | Font | Fallback |
|-------|------|----------|
| Headings | Inter | system-ui, sans-serif |
| Body | Inter | system-ui, sans-serif |
| Arabic headings | Noto Sans Arabic | system-ui, sans-serif |
| Arabic body | Noto Sans Arabic | system-ui, sans-serif |
| Mono (code) | JetBrains Mono | monospace |

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| h1 | 32px | 40px | 700 | Page titles |
| h2 | 24px | 32px | 600 | Section headers |
| h3 | 20px | 28px | 600 | Card titles |
| h4 | 16px | 24px | 600 | Sub-section headers |
| body-lg | 16px | 24px | 400 | Large body text |
| body | 14px | 20px | 400 | Default body |
| body-sm | 13px | 18px | 400 | Small body |
| caption | 12px | 16px | 400 | Captions, timestamps |
| overline | 11px | 16px | 600 | Labels, badges |
| button | 14px | 20px | 500 | Button text |
| button-lg | 16px | 24px | 600 | Primary buttons |

## 21.2 Spacing Scale

| Token | Value |
|-------|-------|
| 0 | 0px |
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 20px |
| 6 | 24px |
| 7 | 28px |
| 8 | 32px |
| 9 | 36px |
| 10 | 40px |
| 12 | 48px |
| 14 | 56px |
| 16 | 64px |

## 21.3 Elevation / Shadow

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.05) | 0 1px 2px rgba(0,0,0,0.3) | Subtle separation |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3) | Cards, dropdowns |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) | 0 4px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3) | Elevated cards, modals |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | 0 10px 15px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.3) | Drawers, dialogs |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) | 0 20px 25px rgba(0,0,0,0.5), 0 10px 10px rgba(0,0,0,0.3) | Toast, tooltips |

## 21.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-none | 0px | — |
| radius-sm | 4px | Inputs, small elements |
| radius-md | 6px | Cards, buttons |
| radius-lg | 8px | Modals, panels |
| radius-xl | 12px | Large cards, thumbnails |
| radius-2xl | 16px | Drawers |
| radius-full | 9999px | Badges, avatars, pills |

## 21.5 Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| border-default | 1px solid gray-200 | 1px solid gray-800 | Card borders, dividers |
| border-light | 1px solid gray-100 | 1px solid gray-900 | Subtle separators |
| border-input | 1px solid gray-300 | 1px solid gray-700 | Input fields |
| border-focus | 2px solid primary-500 | 2px solid primary-400 | Focus state |
| border-destructive | 1px solid red-500 | 1px solid red-400 | Error state |

## 21.6 Icons

- Library: lucide-react (all icons)
- Size: 16px (small), 20px (medium), 24px (large)
- Content type icons: 20px with type color
- Navigation icons: 20px, gray-500
- Action icons: 16px
- Drag handle: 6-dot grid (GripVertical icon)

## 21.7 Illustrations

- Style: Outline, two-tone, 32px stroke rounded
- Empty states: custom illustrations with primary + accent colors
- Error states: same illustration style with amber/red accent
- All illustrations support dark mode (inverted or adapted palette)
- Source: custom illustrations (not stock)

## 21.8 Charts

- Library: recharts (React-native charts)
- Colors: primary palette + sequential palette for category data
- Line charts: 2px stroke, gradient fill
- Bar charts: rounded corners (4px)
- Pie/donut: 8px thickness
- Responsive: all charts resize with container
- Tooltip: white/dark-800 background, 12px border radius, shadow-md
- Empty chart: "No data available" centered text

## 21.9 Badges

| Variant | Light | Dark | Usage |
|---------|-------|------|-------|
| default | bg-gray-100 text-gray-700 | bg-gray-800 text-gray-300 | Generic |
| primary | bg-primary-100 text-primary-700 | bg-primary-900 text-primary-300 | Status |
| success | bg-green-100 text-green-700 | bg-green-900 text-green-300 | Published, completed |
| warning | bg-amber-100 text-amber-700 | bg-amber-900 text-amber-300 | Draft, warning |
| destructive | bg-red-100 text-red-700 | bg-red-900 text-red-300 | Error, blocked |
| info | bg-blue-100 text-blue-700 | bg-blue-900 text-blue-300 | Informational |

Badge shape: rounded-full, padding 4px 10px, font-size 12px, font-weight 500.

## 21.10 Chips / Pills

- Used for: filter options, tags, content type selection
- Height: 32px
- Padding: 8px 14px
- Border radius: 9999px
- Close button (X) on removable chips: 14px, right padding
- Active: filled with primary color
- Inactive: outlined with gray border

## 21.11 Buttons

### Primary Button
- Height: 40px (default), 48px (large), 32px (small)
- Padding: 12px 20px (default)
- Background: primary-600 (light), primary-500 (dark)
- Text: white, 14px medium
- Border radius: 8px
- Hover: primary-700 (light), primary-400 (dark)
- Focus: ring-2 ring-primary-500 ring-offset-2
- Disabled: opacity-50, cursor-not-allowed
- Loading: spinner icon before text

### Secondary Button
- Background: white border (light), gray-800 border (dark)
- Border: 1px gray-300 (light), 1px gray-600 (dark)
- Text: gray-700 (light), gray-300 (dark)
- Hover: bg-gray-50 (light), bg-gray-700 (dark)

### Ghost Button
- No background or border
- Text: gray-700 (light), gray-300 (dark)
- Hover: bg-gray-100 (light), bg-gray-800 (dark)

### Destructive Button
- Background: red-600
- Text: white
- Hover: red-700
- Same sizing as primary

### Icon Button
- Square: 36×36px
- Icon centered
- No background normally
- Hover: bg-gray-100 (light), bg-gray-800 (dark)
- Border radius: 8px

### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 32px | 8px 14px | 12px |
| md (default) | 40px | 10px 18px | 14px |
| lg | 48px | 14px 24px | 16px |

## 21.12 Inputs

- Height: 40px (default)
- Padding: 10px 14px
- Border: 1px gray-300 (light), 1px gray-700 (dark)
- Border radius: 8px
- Background: white (light), gray-800 (dark)
- Text: gray-900 (light), gray-100 (dark)
- Placeholder: gray-400 (light), gray-500 (dark)
- Focus: border primary-500, ring-1 ring-primary-500
- Error: border red-500, ring-1 ring-red-500
- Disabled: bg-gray-100 (light), bg-gray-900 (dark)

### Textarea
- Same as input but with resize-y
- Min-height: 80px (3 rows)
- Max-height: 200px (auto-grow via JS)

### Select
- Same as input
- Custom chevron icon on right
- Native select or custom (based on context)

### Toggle Switch
- Width: 44px, Height: 24px
- Track: gray-300 (off) → primary-500 (on)
- Knob: white circle, 20px diameter
- Animation: 200ms spring on toggle
- Focus: ring-2 ring-primary-500

### Checkbox
- 18×18px square
- Border: gray-300 (light), gray-600 (dark)
- Background: white (light), gray-800 (dark)
- Checked: bg-primary-600, border-primary-600
- Icon: Check, white, 14px
- Animation: scale in on check (100ms)

### Radio
- 18×18px circle
- Border: gray-300 (light), gray-600 (dark)
- Selected: inner dot 8px primary-600
- Animation: dot expand (100ms)

## 21.13 Dialogs / Modals

- Overlay: rgba(0,0,0,0.5) (light), rgba(0,0,0,0.7) (dark)
- Modal width: 480px (default), 640px (large), 320px (small)
- Modal padding: 24px
- Border radius: 16px
- Background: white (light), gray-900 (dark)
- Shadow: shadow-xl
- Header: icon + title (18px semibold)
- Body: description (14px regular)
- Footer: button row (Cancel + Action), right-aligned
- Close: X button top-right
- Animation: scale(0.9→1) + opacity, 200ms
- Dismiss: click overlay, Escape key

## 21.14 Drawers

- Slides from right edge
- Width: 480px (settings), 400px (checklist), 320px (student detail)
- Full height
- Background: white (light), gray-900 (dark)
- Shadow: shadow-xl on left edge
- Overlay: same as modal
- Header: close button + title
- Animation: translateX(100%→0) + opacity, 300ms cubic-bezier
- Dismiss: click overlay, Escape key

## 21.15 Toasts

- Position: top-right (LTR) / top-left (RTL)
- Width: 380px
- Padding: 14px 16px
- Border radius: 10px
- Shadow: shadow-lg
- Background: white (light), gray-800 (dark)
- Icon: contextual (check-circle, alert-circle, x-circle, info)
- Title: 14px semibold
- Description: 13px regular (optional)
- Close button: X, top-right
- Duration: 5s (success), 8s (error), persistent (warning)
- Animation: slide in from top, slide out to top
- Stack: max 3 visible, queue rest
- Types: success (green icon), error (red icon), warning (amber icon), info (blue icon)

---

# 22. RESPONSIVE BEHAVIOUR

## 22.1 Breakpoints

| Name | Min Width | Max Width | Target |
|------|-----------|-----------|--------|
| mobile | 0px | 639px | Phones |
| tablet | 640px | 1023px | Tablets |
| desktop | 1024px | 1279px | Small desktops |
| wide | 1280px+ | — | Large desktops |

## 22.2 Desktop (1024px+)

**Courses Home:**
- 3-4 column grid for cards
- Full sidebar navigation visible
- Search bar at 320px width

**Course Studio:**
- Three-panel layout
- Left Navigator visible (collapsible)
- Inspector Panel visible (collapsible)
- Drag-and-drop enabled
- Full keyboard shortcuts

## 22.3 Tablet (640px-1023px)

**Courses Home:**
- 2-column grid for cards
- Sidebar collapsed (icon-only) by default
- Full-width search bar on focus

**Course Studio:**
- Two-panel layout (Left Navigator collapsed by default)
- Workspace takes full width
- Inspector opens as overlay from right (80% width, max 400px)
- Toggle button in header for Left Navigator
- Drag-and-drop still enabled (touch-friendly drag handles)
- Course tree available via hamburger menu in header

## 22.4 Mobile (0px-639px)

**Courses Home:**
- 1-column grid (cards full width)
- Sidebar hidden (hamburger menu)
- Search bar full width
- Filters as horizontal scrollable chips
- Sort as actionable sheet (bottom)

**Course Studio:**
- Single panel (workspace only)
- Left Navigator: full-screen overlay from left (80% width, max 320px)
- Inspector: bottom sheet (slides up, max 70vh)
- Drag-and-drop disabled (replaced by Move Up / Move Down buttons)
- Content Picker: scrollable horizontal strip
- Touch-optimized: larger tap targets (minimum 44px)
- All inline forms become full-screen or bottom sheets
- File uploads use native mobile upload

---

# 23. ACCESSIBILITY

## 23.1 ARIA

| Component | ARIA Role | ARIA Properties |
|-----------|-----------|-----------------|
| Tree | tree | aria-label="Course structure" |
| Tree item | treeitem | aria-selected, aria-expanded, aria-level |
| Left Navigator | navigation | aria-label="Course navigation" |
| Inspector Panel | complementary | aria-label="Properties panel" |
| Modal | dialog | aria-modal="true", aria-labelledby |
| Drawer | dialog | aria-modal="true", aria-label |
| Toast | status | aria-live="polite" |
| Alert dialog | alertdialog | aria-describedby |
| Tab list | tablist | aria-orientation="horizontal" |
| Tab | tab | aria-selected, aria-controls |
| Tab panel | tabpanel | aria-labelledby |
| Progress bar | progressbar | aria-valuenow, aria-valuemin, aria-valuemax |
| Toggle switch | switch | aria-checked |
| Search | search | aria-label="Search courses" |
| Breadcrumb | navigation | aria-label="Breadcrumb" |
| Menu | menu | — |
| Menu item | menuitem | — |
| Tooltip | tooltip | — |

## 23.2 Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save current state |
| Ctrl+Z | Undo (future: undo stack) |
| Ctrl+Shift+P | Publish course |
| / | Focus search (Courses Home) |
| Escape | Close drawer, modal, dropdown |

### Course Studio Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Toggle Left Navigator |
| Ctrl+I | Toggle Inspector Panel |
| Ctrl+Shift+L | Add new lecture |
| Ctrl+Shift+S | Add new section |
| Ctrl+Shift+C | Add content |
| ↑ / ↓ | Navigate tree items |
| → | Expand tree item |
| ← | Collapse tree item |
| Enter | Select/activate tree item |
| Delete | Delete selected item (with confirmation) |
| F2 | Rename selected item |
| Ctrl+D | Duplicate selected item |
| Ctrl+Shift+↑ | Move item up |
| Ctrl+Shift+↓ | Move item down |

### Tab Order

1. Header (back, title, buttons)
2. Left Navigator (tree items)
3. Center Workspace (content)
4. Inspector Panel (form fields)
5. Status bar

Logical tab order flows left-to-right (top-to-bottom when panels are stacked on mobile).

## 23.3 Focus Management

- When a modal opens, focus moves to the first focusable element inside
- When a modal closes, focus returns to the element that triggered it
- When a drawer opens, focus moves to the first input or close button
- When selected item changes in tree, focus stays in tree (on new item)
- Tab trap within modals and drawers (Tab cycles, Shift+Tab reverse cycles)
- Focus indicator: 2px ring primary-500, offset 2px
- Custom focus ring for all interactive elements (not browser default)

## 23.4 Screen Reader

- All icons have aria-hidden="true" + text labels via aria-label or screen-reader-only text
- Loading states: aria-busy="true" on container
- Dynamic content updates: aria-live regions
- Drag-and-drop: announce "Moved [item] to position [n]" via live region
- Toast messages: aria-live="polite" for non-critical, aria-live="assertive" for errors
- Empty states: descriptive text read by screen reader
- Status changes: announce "Course published" etc.
- Progress updates: announce percentage on upload

## 23.5 Color Contrast

All color combinations meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text):

- Text on background: minimum 4.5:1
- Large text (18px+ bold, 24px+ regular): minimum 3:1
- UI components / graphical objects: minimum 3:1
- Focus indicators: minimum 3:1 against adjacent colors

## 23.6 Reduced Motion

- Respect `prefers-reduced-motion: reduce`
- When enabled: disable all animations, transitions, and parallax
- Replace spring animations with instant (0ms) or fade transitions (100ms minimum)
- No parallax, no animated backgrounds, no confetti
- Skeleton shimmer becomes static placeholder
- Drag-and-drop: no animation on reorder, instant positioning

## 23.7 RTL (Arabic)

- All layouts reverse (flex-direction mirrors automatically via HTML dir="rtl")
- Left Navigator goes to right side
- Inspector Panel goes to left side
- Text alignment: right-aligned for all Arabic content
- Icons: no mirroring for functional icons (arrows reverse)
- Drawers slide from left
- All spacing, margins, paddings reverse
- Inputs: text starts from right
- Breadcrumbs: arrows reverse direction
- Confetti: origin point mirrors

---

# 24. PERFORMANCE

## 24.1 Virtualization

### When to Virtualize
- Content item list in Section Builder when > 20 items
- Student list when > 50 students
- Analytics tables with > 50 rows

### Library
- TanStack Virtual (formerly react-virtual)

### Implementation
- Fixed row height for content items: 52px (collapsed), 200px (expanded)
- Overscan: 5 items above and below viewport
- Student list: row height 48px
- Container must have explicit height for virtualization to work

## 24.2 Memoization

### React.memo
- CourseCard component
- TreeItem component (each level)
- ContentRow component
- Inspector section components
- Content type icons

### useMemo
- Filtered/sorted course list
- Tree structure derived data
- Inspector panel properties derived data
- Analytics computed values

### useCallback
- All event handlers passed as props (onClick, onChange, onDrag, etc.)
- Drag-and-drop callbacks
- Auto-save debounced handler

## 24.3 Caching

### React Query (TanStack Query)

| Query Key | Cache Time | Stale Time | Refetch |
|-----------|-----------|------------|---------|
| ['courses'] | 30 min | 5 min | On window focus |
| ['course', id] | 30 min | 5 min | On window focus |
| ['course-studio', id] | 10 min | 2 min | Never auto (manual only) |
| ['students', courseId] | 10 min | 2 min | On window focus |
| ['analytics', courseId, period] | 10 min | 5 min | On window focus |
| ['content-types'] | 60 min | 30 min | Never |

### Optimistic Updates

- Reorder lectures: immediately reflect in UI, revert on error
- Reorder sections: same
- Reorder content items: same
- Status change (draft↔published): immediate UI update
- Title/description edit: immediate UI update, background save

## 24.4 Optimistic UI

### Patterns
- When dragging to reorder: update order immediately, API call in background
- When editing title inline: update display immediately, save in background
- When toggling completion requirement: toggle immediately, persist
- When publishing checklist passes: show success immediately, process in background

### Conflict Resolution
- If save fails: revert optimistic change, show toast error, retry option
- If reorder conflicts with another user's change: last-write-wins (acceptable for single-instructor scenario)

## 24.5 Bundle Optimization

- Dynamic imports for: Content Builders (each type lazy-loaded), Charts (recharts), Text editor (rich text), Video player
- Route-level code splitting for: Courses Home, Course Studio, each tab
- Tree-shaking: only import used icons from lucide-react

## 24.6 API Call Optimization

- Batch API calls where possible (e.g., save all section changes in one request)
- Debounce auto-save: 2 seconds
- Debounce search: 300ms
- Debounce Inspector Panel input changes: 500ms
- Prefetch course structure data on Courses Home hover (hover on card → prefetch studio data)

---

# 25. FUTURE EXTENSION POINTS

## 25.1 Bunny Media Library

- Video content currently accepts direct upload
- Future: integrate with Bunny Stream for video hosting
- Content Builder will have "Select from Media Library" option
- Media Library shows all uploaded videos with thumbnails, durations, metadata
- Upload to Bunny via signed URLs
- Thumbnail generation via Bunny
- Automatic captioning via Bunny AI

### Extension Points in Current Design:
- `source_id` and `metadata.bunny_media_id` are already in the data model
- Video Content Builder has "Replace Video" — can be extended to "Browse Library"
- Content Picker can gain "Media Library" as a source option alongside "Upload from computer"

## 25.2 Exam Bank

- Exams are currently referenced from an external Exam Bank (future module)
- Content Builder for Exam has "Select from Exam Bank" placeholder
- Future: full Exam Bank UI with question management, categories, random selection
- Integration: Exam Bank module exposes an API that Course Studio calls
- When Exam Bank is available, "Create New Exam" button becomes active

### Extension Points in Current Design:
- `metadata.exam_bank_id` field in content metadata
- Exam Content Builder includes exam selection UI as a drawer
- Inspector Panel for exam shows exam-level settings (time, score, attempts)

## 25.3 Assignments

- Currently manual submissions (file, text, both)
- Future: grading workflow, rubric management, peer review
- Gradebook integration: assignment scores feed into course gradebook
- Plagiarism detection integration

### Extension Points:
- Assignment Content Builder has placeholder for rubric
- `metadata.submission_type` field allows extension
- Student view of assignments is separate module

## 25.4 Certificates

- Certificate content type references templates
- Future: full certificate template builder (visual editor)
- Custom certificate designs per course
- Auto-issuance to students on completion
- Blockchain verification (optional)

### Extension Points:
- Certificate Content Builder has "Manage Templates" button
- `metadata.template_id` field references template module
- `metadata.auto_issue` and requirement flags already modeled

## 25.5 SCORM

- Currently SCORM packages are uploaded and played in a wrapper
- Future: SCORM cloud integration, xAPI statements, advanced tracking
- SCORM player analytics (scores, interactions, time)
- Multiple SCORM versions (1.2, 2004 2nd/3rd/4th Edition)

### Extension Points:
- SCORM Content Builder has "Test Launch" for validation
- `metadata.version` field tracks SCORM version
- Upload area accepts .zip files

## 25.6 AI Integration

### Future AI Features:
- **Auto-generate lecture structure:** Given a course title, AI suggests lecture outline
- **Auto-generate section content:** AI writes descriptions, suggests content items
- **Smart reorder:** AI suggests optimal lecture ordering
- **Content gap analysis:** AI identifies missing prerequisite content
- **Translation:** Auto-translate course content to other languages
- **Quiz generation:** AI generates quiz questions from lecture content
- **Thumbnail generation:** AI generates course thumbnail
- **SEO optimization:** AI suggests meta titles and descriptions
- **Accessibility analysis:** AI checks video captions, contrast, etc.

### Integration Points:
- Course Studio header can have "AI Assistant" button
- AI suggestions appear as inline tooltips with "Apply" button
- AI can be triggered from Publishing Checklist recommendations
- Inspector Panel gains "AI Suggest" button on relevant fields
- Content Builder can have "Generate with AI" option for descriptions

## 25.7 Resources

- Resource content type is currently basic file upload
- Future: resource library across courses, version control, categorization
- Resource marketplace: instructors can share resources
- Template resources: code templates, document templates

### Extension Points:
- Resource Content Builder has basic upload + replace
- `metadata` field can extend with version, category, license

## 25.8 Real-Time Collaboration

- Future: multiple instructors editing same course simultaneously
- WebSocket-based presence (who's viewing/editing what)
- Live cursor indicators in tree
- Conflict resolution via operational transforms or last-write-wins
- Chat/comment system within Course Studio

### Extension Points:
- Course Studio already has entity-level granularity (lecture/section/content)
- Comments field on every entity can serve as basis for collaboration
- Tree structure is ideal for presence indicators

## 25.9 Version History

- Future: full version history for courses
- Snapshot on publish
- Rollback to any previous version
- Diff view: show what changed between versions
- Auto-save versioning (every 5 minutes of changes)

### Extension Points:
- Auto-save infrastructure can be extended to store diffs
- Publishing creates a snapshot point
- Inspector Panel can gain "Version History" tab

## 25.10 Mobile App

- Future: native mobile app for Course Studio
- Optimized for phone content management (not creation)
- Quick edits to titles, descriptions
- Upload images/videos from phone camera
- Review analytics on mobile
- Approve/publish content

### Extension Points:
- Responsive behavior already defined for mobile
- API layer is already built for all operations
- File upload supports mobile media picker

## 25.11 Gamification

- Add achievements and XP to course creation process
- Badges for: first course published, 10 courses, diverse content types, high student ratings
- Leaderboard among instructors (optional per tenant)

### Extension Points:
- Analytics tab can show gamification metrics
- Courses Home can show achievement badges
- Publishing success can award points

---

# APPENDIX A: API ENDPOINT MAPPING

*For reference — to ensure UI design maps cleanly to backend*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/courses | List user's courses |
| POST | /api/courses | Create course |
| GET | /api/courses/{id} | Get course details |
| PUT | /api/courses/{id} | Update course |
| DELETE | /api/courses/{id} | Delete course |
| POST | /api/courses/{id}/duplicate | Duplicate course |
| GET | /api/courses/{id}/studio | Get full studio data (course + tree) |
| GET | /api/courses/{id}/publish-checklist | Get publishing checklist |
| POST | /api/courses/{id}/publish | Publish course |
| POST | /api/courses/{id}/unpublish | Unpublish course |
| GET | /api/courses/{id}/lectures | List lectures |
| POST | /api/courses/{id}/lectures | Create lecture |
| GET | /api/lectures/{id} | Get lecture |
| PUT | /api/lectures/{id} | Update lecture |
| DELETE | /api/lectures/{id} | Delete lecture |
| POST | /api/lectures/{id}/duplicate | Duplicate lecture |
| POST | /api/lectures/reorder | Reorder lectures (batch) |
| GET | /api/lectures/{id}/sections | List sections |
| POST | /api/lectures/{id}/sections | Create section |
| GET | /api/sections/{id} | Get section |
| PUT | /api/sections/{id} | Update section |
| DELETE | /api/sections/{id} | Delete section |
| POST | /api/sections/{id}/duplicate | Duplicate section |
| POST | /api/sections/reorder | Reorder sections (batch) |
| POST | /api/sections/{id}/content | Create content item |
| GET | /api/content/{id} | Get content item |
| PUT | /api/content/{id} | Update content item |
| DELETE | /api/content/{id} | Delete content item |
| POST | /api/content/{id}/duplicate | Duplicate content item |
| POST | /api/content/reorder | Reorder content items (batch) |
| GET | /api/students?course_id={id} | List enrolled students |
| POST | /api/courses/{id}/enroll | Enroll student |
| DELETE | /api/courses/{id}/enroll/{userId} | Remove enrollment |
| GET | /api/analytics/courses/{id} | Get course analytics |
| GET | /api/analytics/courses/{id}/export | Export analytics CSV |

---

# APPENDIX B: FILE UPLOAD SPECIFICATION

## Upload Flow

1. User selects file or drops file onto upload zone
2. Client validates: file type, size, dimensions (for images)
3. Client generates a unique file ID (UUID)
4. Client requests a signed upload URL from API: `POST /api/uploads/sign`
5. API returns signed URL (for Bunny, S3, or local storage)
6. Client uploads file directly to signed URL
7. Client polls or receives webhook for processing status
8. On completion: content item is created with the file reference
9. On failure: toast error, retry option

## Validation Rules

| Content Type | Allowed Formats | Max Size | Notes |
|-------------|----------------|----------|-------|
| Video | mp4, webm, mov, avi | 5GB | Bunny Stream recommended |
| PDF | pdf | 200MB | |
| Resource | zip, rar, 7z, tar.gz, pdf, doc, docx, xls, xlsx | 500MB | |
| Audio | mp3, wav, aac, ogg, flac | 500MB | |
| Image | jpg, jpeg, png, webp, svg | 10MB | For thumbnails, covers |
| SCORM | zip | 500MB | Must contain imsmanifest.xml |

## Progress Indication

- Circular determinate progress bar during upload
- Shows: percentage, speed (MB/s), remaining time
- Background upload: user can continue editing while upload runs
- Pause/Resume: optional (nice to have for v2)
- Cancel upload: X button on progress

---

# APPENDIX C: ERROR STATES MATRIX

| Screen | Error | UI Treatment |
|--------|-------|-------------|
| Courses Home | Network failure | Error illustration + "Retry" button |
| Courses Home | 403 Forbidden | "You don't have access" message |
| Course Studio | Course not found | "Course not found" page with back link |
| Course Studio | Save conflict | "Another session saved changes" toast + reload option |
| Course Studio | Upload failed | Toast "Upload failed" + retry button on item |
| Inspector | Update failed | Inline error under field + "Retry" button |
| Publishing | Publish failed | Toast detail + checklist item with error |
| Analytics | No data | "No data available" state per chart |
| Students | Enroll failed | Modal error "User not found" |
| Any | Rate limit | "Too many requests. Please wait." toast |

---

*End of Specification — Course Studio v1.0*

---

This document is the complete, exhaustive engineering specification for the Course Studio module. Every screen, interaction, data model, animation, accessibility requirement, and extension point has been specified with zero ambiguity. An AI implementation agent should be able to build this module entirely from this document without requiring further clarification.
