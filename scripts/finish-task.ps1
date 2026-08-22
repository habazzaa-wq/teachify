<#
.SYNOPSIS
    Safely finishes a task: merges its branch into deploy, pushes, rebases other active
    tasks onto the updated deploy, then cleans up the worktree + branch.
.EXAMPLE
    .\scripts\finish-task.ps1 feat/wallet
    .\scripts\finish-task.ps1 feat/wallet -NoPush -KeepWorktree
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Branch,

    [switch]$KeepWorktree,
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

$repo      = Get-RepoRoot
$worktrees = @(Get-Worktrees -RepoRoot $repo)

Write-Step "Finishing task branch '$Branch'"

if ($Branch -eq 'deploy') {
    Write-Fail "Refusing to merge 'deploy' into itself."
    exit 1
}

$target = $worktrees | Where-Object { $_.Branch -eq $Branch } | Select-Object -First 1
if ($null -eq $target) {
    Write-Fail "No worktree found for branch '$Branch'."
    Write-Warn2 "Run '.\scripts\tasks-status.ps1' to see active tasks and their branches."
    exit 1
}
$taskPath = $target.Path

# ---- 1) Dirty checks ----------------------------------------------------------
if (-not (Test-CleanTree -Path $taskPath)) {
    Write-Fail "Uncommitted changes in '$taskPath'."
    Write-Warn2 "Commit (or clean) them inside that session first, then re-run this script."
    exit 1
}

$mainWt = $worktrees | Where-Object { $_.Path -eq $repo } | Select-Object -First 1
if ($null -eq $mainWt -or $mainWt.Branch -ne 'deploy') {
    Write-Fail "Main copy is not on branch 'deploy' (it is on: '$($mainWt.Branch)')."
    exit 1
}
if (-not (Test-CleanTree -Path $repo)) {
    Write-Fail "Main working tree has uncommitted changes."
    Write-Warn2 "Commit or stash them first; the main copy is the integration point."
    exit 1
}

# ---- 2) Update deploy ----------------------------------------------------------
& git -C $repo pull --ff-only origin deploy | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warn2 "'git pull' failed (offline? remote issue?) - continuing with local deploy."
}

# ---- 3) Merge -------------------------------------------------------------------
& git -C $repo merge --no-ff $Branch -m "merge: $Branch into deploy" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Merge conflict while merging '$Branch' into deploy."
    Write-Warn2 "Resolve conflicts in the main copy, then: git add -A ; git commit ; git push"
    exit 1
}
Write-Ok "Merged '$Branch' into deploy"

# ---- 4) Push --------------------------------------------------------------------
if (-not $NoPush) {
    & git -C $repo push origin deploy | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Warn2 "Push failed - run manually later: git push origin deploy" }
    else                     { Write-Ok "Pushed deploy to origin" }
} else {
    Write-Warn2 "-NoPush given: deploy was NOT pushed."
}

# ---- 5) Rebase remaining active tasks -------------------------------------------
$others = @($worktrees | Where-Object { $_.Path -ne $repo -and $_.Branch -ne $Branch })
foreach ($wt in $others) {
    if (-not (Test-CleanTree -Path $wt.Path)) {
        Write-Warn2 "$($wt.Path): has uncommitted changes - skipped rebase (rebase it manually when committed)."
        continue
    }
    & git -C $wt.Path rebase deploy | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Rebased $($wt.Branch) onto latest deploy"
    } else {
        Write-Fail "$($wt.Branch): rebase conflicts in $($wt.Path)"
        Write-Warn2 "Resolve there, then: git add -A ; git rebase --continue   (or: git rebase --abort)"
    }
}

# ---- 6) Cleanup -------------------------------------------------------------------
if (-not $KeepWorktree) {
    # Remove junction links first so nothing can recurse into shared deps.
    Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\web\node_modules') | Out-Null
    Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\api\vendor')       | Out-Null

    & git -C $repo worktree remove "$taskPath" | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Removed worktree $taskPath" }
    else                     { Write-Warn2 "Could not auto-remove worktree; run: git worktree remove `"$taskPath`"" }

    & git -C $repo branch -d $Branch | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Deleted branch $Branch" }
    else                     { Write-Warn2 "Could not delete branch '$Branch' (not merged?). Keep it or delete with -D." }
} else {
    Write-Warn2 "-KeepWorktree given: worktree and branch kept."
}

Write-Host ''
Write-Step "Task '$Branch' finished successfully."
exit 0
