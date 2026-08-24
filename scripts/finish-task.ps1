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
    .\scripts\finish-task.ps1 feat/wallet -NoPush
    .\scripts\finish-task.ps1 -Help
#>
param(
    [Parameter(Position = 0)]
    [string]$Name,

    [switch]$Commit,
    [string]$Message,
    [switch]$NoPush,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

$repo      = Get-RepoRoot
$worktrees = @(Get-Worktrees -RepoRoot $repo)
$tasksRoot = Split-Path -Parent $repo

if ($Help -or -not $Name) {
    Get-Help -Name $MyInvocation.MyCommand.Path -Full
    if (-not $Help) { Write-Fail "Task name is required." }
    return
}

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
        $conflicts = @(& git -C $tmp diff --name-only --diff-filter=U)
        Write-Fail "Merge conflict while merging '$Branch'."
        Write-Warn2 "Conflicting files:"
        $conflicts | ForEach-Object { Write-Host "    $_" }
        $ans = Read-Host "Auto-resolve ALL conflicts using the INCOMING branch ($Branch) version? [y/N] (else resolve manually)"
        if ($ans -notmatch '^[yY]') {
            Write-Warn2 "Resolve manually in: $tmp"
            Write-Warn2 "then: git add -A ; git commit ; git push origin HEAD:deploy ; git -C '$repo' worktree remove '$tmp'"
            exit 1
        }
        # Take the incoming branch's version for every conflicted file, then commit
        # the merge. This is safe for styling-only clashes; choose 'n' for anything
        # that needs a real 3-way resolution.
        $conflicts | ForEach-Object { & git -C $tmp checkout --theirs -- "$_" | Out-Null }
        & git -C $tmp add -A
        & git -C $tmp commit -m "merge: $Branch into deploy" | Out-Null
        Write-Ok "Auto-resolved conflicts using $Branch version"
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

# ---- 4) Cleanup (ask before removing the worktree/folder) --------------------
if (-not $KeepWorktree) {
    $ans = Read-Host "Delete task worktree '$taskPath' and branch '$Branch'? [y/N] (Enter = keep working on it)"
    if ($ans -notmatch '^[yY]') {
        Write-Warn2 "Kept worktree '$taskPath' and branch '$Branch'. Continue editing; run finish-task again later to finalize."
    } else {
        Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\web\node_modules') | Out-Null
        Remove-JunctionLink -Destination (Join-Path $taskPath 'apps\api\vendor')       | Out-Null

        # Unregister the git worktree, then force-delete the folder even if an
        # opencode session is still holding it open.
        & git -C $repo worktree remove --force "$taskPath" | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Ok "Removed worktree $taskPath" }
        else                     { Write-Warn2 "Could not unregister worktree; will try to delete the folder directly." }

        if (Test-Path -LiteralPath $taskPath) {
            Remove-Item -LiteralPath $taskPath -Recurse -Force -ErrorAction SilentlyContinue
            if (Test-Path -LiteralPath $taskPath) { & cmd /c "rmdir /s /q `"$taskPath`"" 2>$null }
            # Still locked? Close any opencode session that has this folder open,
            # then retry once. Never targets the current process tree.
            if (Test-Path -LiteralPath $taskPath) {
                $curPid = $PID
                $parent = (Get-CimInstance Win32_Process -Filter "ProcessId=$curPid" -ErrorAction SilentlyContinue).ParentProcessId
                Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
                    Where-Object { ($_.Name -match 'opencode') -and ($_.CommandLine -like "*$taskPath*") -and ($_.ProcessId -ne $curPid) -and ($_.ProcessId -ne $parent) } |
                    ForEach-Object {
                        Write-Warn2 "Closing opencode session holding the folder (pid $($_.ProcessId))"
                        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                    }
                Start-Sleep -Seconds 1
                Remove-Item -LiteralPath $taskPath -Recurse -Force -ErrorAction SilentlyContinue
                if (Test-Path -LiteralPath $taskPath) { & cmd /c "rmdir /s /q `"$taskPath`"" 2>$null }
            }
            if (Test-Path -LiteralPath $taskPath) {
                Write-Warn2 "Folder still in use. Close the opencode session for this task, then: Remove-Item -Recurse -Force '$taskPath'"
            } else {
                Write-Ok "Deleted folder $taskPath"
            }
        }

        # The branch was merged into deploy and pushed (via the temp worktree), but
        # the LOCAL 'deploy' branch is often not yet in sync (its sync is blocked
        # because it is checked out in the main worktree). So `git branch -d`
        # against the local deploy can falsely report "not fully merged". Verify the
        # branch actually landed in origin/deploy (the authoritative state) and force
        # delete only then; otherwise keep it to avoid losing unpushed work.
        & git -C $repo branch -d $Branch | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Deleted branch $Branch"
        } else {
            $merged = & git -C $repo merge-base --is-ancestor $Branch "origin/deploy" 2>$null
            if ($LASTEXITCODE -eq 0) {
                & git -C $repo branch -D $Branch | Out-Null
                Write-Ok "Deleted branch $Branch (verified merged into origin/deploy)"
            } else {
                Write-Warn2 "Branch '$Branch' not merged into origin/deploy - kept. Delete manually with: git branch -D $Branch"
            }
        }
    }
} else {
    Write-Warn2 "-KeepWorktree given: worktree and branch kept."
}

Write-Host ''
Write-Step "Task '$Branch' finished successfully."
exit 0
