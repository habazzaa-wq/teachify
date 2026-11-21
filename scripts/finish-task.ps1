<#
.SYNOPSIS
    Safely finishes a task: merges its branch into deploy, pushes, rebases other active
    tasks onto the updated deploy, then cleans up the worktree + branch.
.DESCRIPTION
    Accepts the task name (e.g. 'wallet'), the full branch (e.g. 'feat/wallet'),
    or the worktree folder leaf (e.g. 'tf-wallet').
    Pending changes are committed automatically (-NoCommit opts out). The merge+push
    runs in a throwaway detached worktree, so the main copy's working tree is never
    touched. Conflicts stop the script with instructions, unless -TakeTheirs is given.
.EXAMPLE
    .\scripts\finish-task.ps1 betaka
    .\scripts\finish-task.ps1 too1 -KeepWorktree
    .\scripts\finish-task.ps1 too1 -TakeTheirs
    .\scripts\finish-task.ps1 feat/wallet -NoPush
    .\scripts\finish-task.ps1 -Help
#>
param(
    [Parameter(Position = 0)]
    [string]$Name,

    [switch]$Commit,      # kept for compatibility - committing is now the default
    [switch]$NoCommit,    # opt out: refuse to auto-commit pending work
    [string]$Message,
    [switch]$NoPush,
    [switch]$KeepWorktree,
    [switch]$RebaseOthers,   # opt-in: rewrite other task branches onto the new deploy
    [switch]$TakeTheirs,     # on conflict, accept the incoming task branch's version
    [switch]$Help
)

# git writes progress to stderr; with 'Stop' PowerShell turns that into a terminating
# error and aborts the deploy. Exit codes below are the source of truth.
$ErrorActionPreference = 'Continue'
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
# Committing is the default now: finishing a task without shipping its pending work
# is the mistake that produces a "nothing changed" deploy.
$dirtyFiles = @(& git -C $taskPath status --porcelain)
if ($dirtyFiles.Count -gt 0) {
    if ($NoCommit) {
        Write-Fail "Uncommitted changes in '$taskPath'."
        Write-Warn2 "Commit them first, or re-run without -NoCommit to let finish-task commit them."
        exit 1
    }
    Write-Step "Committing $($dirtyFiles.Count) pending change(s) in '$taskPath'"
    $dirtyFiles | Select-Object -First 10 | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
    if ($dirtyFiles.Count -gt 10) { Write-Host "     ... and $($dirtyFiles.Count - 10) more" -ForegroundColor DarkGray }
    & git -C $taskPath add -A
    if ($LASTEXITCODE -ne 0) { Write-Fail "'git add -A' failed in '$taskPath'."; exit 1 }
    $msg = if ($Message) { $Message } else { "feat($($Branch -replace '^feat/','')): $Name task changes" }
    & git -C $taskPath commit -m $msg | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Auto-commit failed in '$taskPath'."
        exit 1
    }
    Write-Ok "Committed pending changes ($(& git -C $taskPath rev-parse --short HEAD))"
}

$mainWt = $worktrees | Where-Object { $_.Path -eq $repo } | Select-Object -First 1
if ($null -eq $mainWt -or $mainWt.Branch -ne 'deploy') {
    Write-Fail "Main copy is not on branch 'deploy' (it is on: '$($mainWt.Branch)')."
    exit 1
}

# ---- 2) Integration in a throwaway detached worktree ------------------------
# This keeps the main copy's working tree (and any unrelated local changes) fully
# untouched. We merge the task branch and push from a fresh copy of origin/deploy.
& git -C $repo fetch --quiet origin deploy | Out-Null
$oldDeploySha = (& git -C $repo rev-parse origin/deploy).Trim()
$taskTip      = (& git -C $repo rev-parse $Branch).Trim()
if ($taskTip -eq $oldDeploySha) {
    Write-Fail "Task branch '$Branch' has no new commits over origin/deploy - nothing to finish."
    Write-Warn2 "Make your changes in $taskPath, then run finish-task again."
    exit 1
}
Write-Ok "Task branch tip: $taskTip (deploy before: $oldDeploySha)"

$ts    = Get-Date -Format 'yyyyMMddHHmmss'
$tmp   = Join-Path $tasksRoot "tf-merge-$ts"
Write-Step "Preparing isolated merge worktree at $tmp"
& git -C $repo worktree add --detach --quiet "$tmp" "origin/deploy" | Out-Null
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
        if (-not $TakeTheirs) {
            # Never prompt here: in CI/non-interactive shells Read-Host throws a
            # terminating error that jumps to finally and the script then falsely
            # reports success. Failing explicitly keeps the merge worktree for you.
            Write-Warn2 "Resolve manually in: $tmp"
            Write-Warn2 "then: git add -A ; git commit --no-edit ; git push origin HEAD:deploy"
            Write-Warn2 "Or re-run with -TakeTheirs to accept '$Branch' versions of conflicting files."
            exit 1
        }
        # Explicit opt-in only: take the incoming branch's version for every
        # conflicted file. Good for whole-file replacement (redesigns), unsafe when
        # both sides added unrelated lines to the same file.
        $conflicts | ForEach-Object { & git -C $tmp checkout --theirs -- "$_" | Out-Null }
        $addOut = & git -C $tmp add -A 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Fail "'git add -A' failed after conflict resolution."; exit 1 }
        & git -C $tmp commit --no-edit -m "merge: $Branch into deploy" | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Fail "Committing the resolved merge failed in '$tmp'."; exit 1 }
        Write-Ok "Auto-resolved conflicts using $Branch version (-TakeTheirs)"
    }
    $mergeSucceeded = $true

    if (-not $NoPush) {
        & git -C $tmp push --quiet origin "HEAD:deploy" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Push to deploy failed (concurrent push?). Push manually: git -C `"$tmp`" push origin HEAD:deploy"
            exit 1
        }
        & git -C $repo fetch --quiet origin deploy | Out-Null
        $newDeploySha = (& git -C $repo rev-parse origin/deploy).Trim()
        if ($newDeploySha -eq $oldDeploySha) {
            Write-Fail "Push reported success but origin/deploy did not move ($oldDeploySha)."
            exit 1
        }
        & git -C $repo merge-base --is-ancestor $Branch origin/deploy 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Branch '$Branch' is not contained in origin/deploy - refusing to report success."
            exit 1
        }
        Write-Ok "Pushed task to origin/deploy: $oldDeploySha -> $newDeploySha"
        Write-Warn2 "Local 'deploy' ref is left alone (it is checked out in the main worktree with your WIP)."
        Write-Warn2 "deploy-server.ps1 always deploys origin/deploy, so this is expected and safe."
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
# Opt-in: silently rewriting ~20 other task branches on every finish is slow and
# risky. Pass -RebaseOthers when you actually want them moved onto the new deploy.
$rebased = 0
if ($RebaseOthers) {
$others = @($worktrees | Where-Object { $_.Path -ne $repo -and $_.Branch -ne $Branch -and $_.Branch -ne '' })
foreach ($wt in $others) {
    if (-not (Test-Path -LiteralPath (Join-Path $wt.Path '.git'))) {
        Write-Warn2 "$($wt.Branch): worktree folder is gone - skipped."
        continue
    }
    & git -C $wt.Path merge-base --is-ancestor origin/deploy $wt.Branch 2>$null
    if ($LASTEXITCODE -eq 0) { continue }
    if (-not (Test-CleanTree -Path $wt.Path)) {
        Write-Warn2 "$($wt.Branch): has uncommitted changes - skipped rebase (rebase it manually when committed)."
        continue
    }
    & git -C $wt.Path rebase --quiet origin/deploy | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Rebased $($wt.Branch) onto latest deploy"
        $rebased++
    } else {
        Write-Fail "$($wt.Branch): rebase conflicts in $($wt.Path)"
        Write-Warn2 "Resolve there, then: git add -A ; git rebase --continue   (or: git rebase --abort)"
    }
}
if ($rebased -eq 0) { Write-Ok "No other active tasks needed rebasing." }
} else {
    Write-Ok "Other task branches left untouched (pass -RebaseOthers to rebase them)."
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
if ($NoPush) {
    Write-Warn2 "Nothing was pushed (-NoPush). Run finish-task again without -NoPush to publish."
} else {
    Write-Host " origin/deploy : $newDeploySha"
    Write-Host " Next step     : .\scripts\deploy-server.ps1 -Yes"
}
Write-Host ''
exit 0
