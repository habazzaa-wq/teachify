<#
.SYNOPSIS
    Creates an isolated worktree for a new task: folder + branch + env files + shared dependencies.
.EXAMPLE
    .\scripts\new-task.ps1 wallet
    .\scripts\new-task.ps1 achievements -Prefix feat
#>
param(
    [Parameter(Mandatory = $true, Position = 0, HelpMessage = 'Task name, e.g. wallet')]
    [string]$Name,

    [string]$Prefix = 'feat'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

$repo      = Get-RepoRoot
$branch    = "$Prefix/$Name"
$tasksRoot = Split-Path -Parent $repo
$folder    = Join-Path $tasksRoot ("tf-$Name")

Write-Step "Creating task '$Name' (branch: $branch)"

# ---- 1) Validate name -------------------------------------------------------
if ($Name -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_-]*$') {
    Write-Fail "Invalid task name '$Name'. Use letters, digits, '-' or '_' only."
    exit 1
}

# ---- 2) Pre-flight checks ---------------------------------------------------
$worktrees = @(Get-Worktrees -RepoRoot $repo)

foreach ($wt in $worktrees) {
    if ((Split-Path -Leaf $wt.Path) -eq "tf-$Name") {
        Write-Fail "A task folder 'tf-$Name' already exists as a worktree ($($wt.Path))."
        Write-Warn2 "Run '.\scripts\tasks-status.ps1' to see active tasks."
        exit 1
    }
    if ($wt.Branch -eq $branch) {
        Write-Fail "Branch '$branch' is already checked out in worktree $($wt.Path)."
        exit 1
    }
}
if (& git -C $repo show-ref --verify --quiet "refs/heads/$branch") {
    Write-Fail "Local branch '$branch' already exists (leftover from an old task?)."
    Write-Warn2 "Delete it first with: git branch -D $branch  -or- pick another name."
    exit 1
}
if (Test-Path -LiteralPath $folder) {
    Write-Fail "Folder already exists on disk: $folder"
    exit 1
}

$existingTaskCount = @($worktrees | Where-Object { (Split-Path -Leaf $_.Path) -like 'tf-*' }).Count

# ---- 3) Create the worktree -------------------------------------------------
& git -C $repo worktree add -b $branch "$folder" HEAD | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "'git worktree add' failed."; exit 1 }
Write-Ok "Worktree created at $folder"

# ---- 4) Copy untracked env files -------------------------------------------
$copied = @(Copy-UntrackedEnvFiles -RepoRoot $repo -DestinationRoot $folder)
if ($copied.Count -gt 0) {
    foreach ($c in $copied) { Write-Ok "Copied env file: $c" }
} else {
    Write-Warn2 "No untracked .env files found to copy."
}

# ---- 5) Link shared dependencies (no install needed) ------------------------
$linkSpecs = @(
    @{ Src = Join-Path $repo 'apps\web\node_modules'; Dst = Join-Path $folder 'apps\web\node_modules'; Label = 'web node_modules' },
    @{ Src = Join-Path $repo 'apps\api\vendor';       Dst = Join-Path $folder 'apps\api\vendor';       Label = 'api vendor' }
)
foreach ($spec in $linkSpecs) {
    $result = New-JunctionLink -Source $spec.Src -Destination $spec.Dst
    switch ($result) {
        'linked'          { Write-Ok "Linked $($spec.Label)" }
        'exists'          { Write-Warn2 "$($spec.Label) already exists in the new tree." }
        'missing-source'  { Write-Warn2 "$($spec.Label): source not found in main copy - run its install there later." }
        default           { Write-Warn2 "$($spec.Label): junction could not be created." }
    }
}

# ---- 6) Suggested ports ------------------------------------------------------
$webPort = 3000 + $existingTaskCount + 1
$apiPort = 8000 + $existingTaskCount + 1

# ---- Summary ------------------------------------------------------------------
Write-Host ''
Write-Step 'Task is ready'
Write-Host " Folder     : $folder"
Write-Host " Branch     : $branch"
Write-Host " Web port   : $webPort   -> npm run dev -- -p $webPort"
Write-Host " API port   : $apiPort   -> php artisan serve --port=$apiPort"
Write-Host ''
Write-Host ' Next steps:'
Write-Host "   1. Open your editor / opencode session inside the folder above."
Write-Host "   2. Commit often to '$branch'."
Write-Host "   3. When done, from repo root run:"
Write-Host "        .\scripts\finish-task.ps1 $branch"
Write-Host ''
Write-Warn2 'House rules: run migrations from ONE place at a time; run package installs from the MAIN copy only.'
exit 0
