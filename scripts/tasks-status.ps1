<#
.SYNOPSIS
    Shows all active task worktrees: branch, uncommitted changes, and how far each is from deploy.
#>

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

$repo      = Get-RepoRoot
$worktrees = @(Get-Worktrees -RepoRoot $repo)

$rows = foreach ($wt in $worktrees) {
    $isMain = ($wt.Path -eq $repo)
    $name   = if ($isMain) { '(main)' } else { Split-Path -Leaf $wt.Path }
    $branch = if ($wt.Branch) { $wt.Branch } else { '(detached)' }

    $dirtyItems = @(& git -C $wt.Path status --porcelain)
    $dirty = @($dirtyItems).Count

    $behind = '-'
    $ahead  = '-'
    if (-not $isMain -and $branch -ne '(detached)' -and $branch -ne 'deploy') {
        $lr = & git -C $repo rev-list --left-right --count "deploy...$branch" 2>$null
        if ($LASTEXITCODE -eq 0 -and $lr) {
            $parts = @("$lr" -split '\s+')
            if ($parts.Count -ge 2) { $behind = [int]$parts[0]; $ahead = [int]$parts[1] }
        }
    }

    [pscustomobject]@{
        Task    = $name
        Branch  = $branch
        Changes = $dirty
        BehindDeploy = $behind
        AheadOfDeploy = $ahead
        Path    = $wt.Path
    }
}

Write-Host ''
$rows | Format-Table -AutoSize | Out-String | ForEach-Object { Write-Host $_ }
Write-Host ' Commands:'
Write-Host '   new task     : .\scripts\new-task.ps1 <name>'
Write-Host '   finish task  : .\scripts\finish-task.ps1 <branch>   (e.g. feat/wallet)'
exit 0
