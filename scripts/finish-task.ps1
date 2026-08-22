<#
.SYNOPSIS
    Safely finishes a task: merges its branch into deploy, pushes, rebases other active
    tasks onto the updated deploy, then cleans up the worktree + branch.
.DESCRIPTION
    Accepts the task name (e.g. 'wallet'), the full branch (e.g. 'feat/wallet'),
    or the worktree folder leaf (e.g. 'tf-wallet').
    By default it refuses to merge uncommitted changes; pass -Commit to stage and
    commit them automatically before merging.
    The integration (merge + push) runs in a throwaway detached worktree, so the
    main copy's working tree is never touched - your unrelated local changes stay put.
.EXAMPLE
    .\scripts\finish-task.ps1 betaka
    .\scripts\finish-task.ps1 betaka -Commit
    .\scripts\finish-task.ps1 feat/wallet -NoPush -KeepWorktree
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Name,

    [switch]$Commit,
    [string]$Message,
    [switch]$KeepWorktree,
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

$repo      = Get-RepoRoot
$worktrees = @(Get-Worktrees -RepoRoot $repo)
$tasksRoot = Split-Path -Parent $repo

# ---- Resolve the task name into a branch + worktree ---------------------------
function Resolve-Task {
    param([string]$InputName)
    $wt = $worktrees | Where-Object { $_.Branch -eq $InputName } | Select-Object -First 1
    if ($null -ne $wt) { return $wt }
    if ($InputName -notmatch '/') {
        $wt = $worktrees | Where-Object { $_.Branch -eq "feat/$InputName" } | Select-Object -First 1
        if ($null -ne $wt) { return $wt }
    }
    $leaf = $InputName
    if ($leaf -notmatch '^tf-') { $leaf = "tf-$leaf" }
    $wt = $worktrees | Where-Object { (Split-Path -Leaf $_.Path) -eq $leaf } | Select-Object -First 1
    return $wt
}

Write-Step "Finishing task '$Name'"

if ($Name -eq 'deploy') {
    Write-Fail "Refusing to merge 'deploy' into itself."
    exit 1
}

$target = Resolve-Task -InputName $Name
if ($null -eq $target) {
    Write-Fail "No active task found for '$Name'."
    Write-Warn2 "It accepts: task name (betaka), branch (feat/betaka) or folder (tf-betaka)."
    Write-Warn2 "Run '.\scripts\tasks-status.ps1' to list active tasks."
    exit 1
}
$Branch  = $target.Branch
$taskPath = $target.Path
Write-Ok "Resolved to branch '$Branch' ($taskPath)"

# ---- 1) Dirty handling (in the TASK worktree) --------------------------------
if (-not (Test-CleanTree -Path $taskPath)) {
    if ($Commit) {
        Write-Step "Committing pending changes in '$taskPath'"
        & git -C $taskPath add -A
        $msg = if ($Message) { $Message } else { "feat($($Branch -replace '^feat/','')): commit before finishing task" }
        & git -C $taskPath commit -m $msg | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Auto-commit failed in '$taskPath'."
            exit 1
        }
        Write-Ok "Committed pending changes ($(& git -C $taskPath rev-parse --short HEAD))"
    } else {
        Write-Fail "Uncommitted changes in '$taskPath'."
        Write-Warn2 "Either commit them in that session, or re-run with: -Commit  (optional: -Message 'your note')"
        exit 1
    }
}

$mainWt = $worktrees | Where-Object { $_.Path -eq $repo } | Select-Object -First 1
if ($null -eq $mainWt -or $mainWt.Branch -ne 'deploy') {
    Write-Fail "Main copy is not on branch 'deploy' (it is on: '$($mainWt.Branch)')."
    exit 1
}

# ---- 2) Integration in a throwaway detached worktree ------------------------
# This keeps the main copy's working tree (and any unrelated local changes) fully
# untouched. We merge the task branch and push from a fresh copy of origin/deploy.
& git -C $repo fetch origin deploy | Out-Null

$ts    = Get-Date -Format 'yyyyMMddHHmmss'
$tmp   = Join-Path $tasksRoot "tf-merge-$ts"
Write-Step "Preparing isolated merge worktree at $tmp"
& git -C $repo worktree add --detach "$tmp" "origin/deploy" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not create a temporary merge worktree."
    exit 1
}

$mergeSucceeded = $false
try {
    Write-Step "Merging '$Branch' into deploy"
    & git -C $tmp merge --no-ff $Branch -m "merge: $Branch into deploy" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Merge conflict while merging '$Branch'."
        Write-Warn2 "Resolve manually in: $tmp  (then: git add -A ; git commit ; git push origin HEAD:deploy ; git -C '$repo' worktree remove '$tmp')"
        exit 1
    }
    $mergeSucceeded = $true

    if (-not $NoPush) {
        & git -C $tmp push origin "HEAD:deploy" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Push to deploy failed (concurrent push?). Push manually: git -C `"$tmp`" push origin HEAD:deploy"
            exit 1
        }
        Write-Ok "Pushed deploy to origin"
        # Keep the local 'deploy' branch ref in sync so subsequent deploy-server
        # runs see a matching SHA (the push updated origin/deploy, not this ref).
        & git -C $repo fetch origin deploy | Out-Null
        & git -C $repo branch -f deploy "origin/deploy" | Out-Null
        Write-Ok "Synced local 'deploy' ref to origin/deploy"
    } else {
        Write-Warn2 "-NoPush given: changes were merged but NOT pushed."
    }
} finally {
    # On success the merge worktree is removed. On a merge CONFLICT we keep it so
    # the user can resolve the conflict there instead of losing the work.
    if ($mergeSucceeded) {
        & git -C $repo worktree remove "$tmp" --force | Out-Null
    } else {
        Write-Warn2 "Merge worktree left at '$tmp' for you to resolve."
    }
}

# ---- 3) Rebase remaining active tasks onto the updated deploy ----------------
& git -C $repo fetch origin deploy | Out-Null
$others = @($worktrees | Where-Object { $_.Path -ne $repo -and $_.Branch -ne $Branch })
foreach ($wt in $others) {
    if (-not (Test-CleanTree -Path $wt.Path)) {
        Write-Warn2 "$($wt.Path): has uncommitted changes - skipped rebase (rebase it manually when committed)."
        continue
    }
    & git -C $wt.Path rebase origin/deploy | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Rebased $($wt.Branch) onto latest deploy"
    } else {
        Write-Fail "$($wt.Branch): rebase conflicts in $($wt.Path)"
        Write-Warn2 "Resolve there, then: git add -A ; git rebase --continue   (or: git rebase --abort)"
    }
}

# ---- 4) Cleanup --------------------------------------------------------------
if (-not $KeepWorktree) {
    Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\web\node_modules') | Out-Null
    Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\api\vendor')       | Out-Null

    & git -C $repo worktree remove "$taskPath" | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Removed worktree $taskPath" }
    else {
        Write-Warn2 "Could not auto-remove worktree (is an editor/session still open on it?)."
        Write-Warn2 "Close it, then run: git -C `"$repo`" worktree remove `"$taskPath`""
    }

    & git -C $repo branch -d $Branch | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Deleted branch $Branch" }
    else                     { Write-Warn2 "Could not delete branch '$Branch' (not merged?). Keep it or delete with -D." }
} else {
    Write-Warn2 "-KeepWorktree given: worktree and branch kept."
}

Write-Host ''
Write-Step "Task '$Branch' finished successfully."
exit 0
