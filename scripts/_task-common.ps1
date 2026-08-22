# Shared helpers for the task worktree scripts (new-task / finish-task / tasks-status).
# This file is dot-sourced, never run directly.

function Get-RepoRoot {
    # scripts/ lives directly under the repo root
    return (Split-Path -Parent $PSScriptRoot)
}

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message)   { Write-Host " [ok] $Message" -ForegroundColor Green }
function Write-Warn2([string]$Message){ Write-Host " [!]  $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host " [x]  $Message" -ForegroundColor Red }

function Get-Worktrees {
    <#
        Returns a list of objects: Path (normalized backslashes), Head, Branch ('' when detached).
    #>
    param([Parameter(Mandatory = $true)][string]$RepoRoot)

    $result = @()
    $out = @(& git -C $RepoRoot worktree list --porcelain)
    $current = $null
    foreach ($line in $out) {
        if ($line -like 'worktree *') {
            $current = [pscustomobject]@{
                Path   = ($line.Substring(9)).Replace('/', '\')
                Head   = ''
                Branch = ''
            }
        }
        elseif ($null -ne $current) {
            if     ($line -like 'HEAD *')   { $current.Head = $line.Substring(5) }
            elseif ($line -like 'branch *') { $current.Branch = $line.Substring(7) -replace '^refs/heads/', '' }
            elseif ($line -eq '')           { $result += $current; $current = $null }
        }
    }
    if ($null -ne $current) { $result += $current }
    return @($result)
}

function Test-CleanTree {
    param([Parameter(Mandatory = $true)][string]$Path)
    $status = & git -C $Path status --porcelain
    return (@($status).Count -eq 0)
}

function Copy-UntrackedEnvFiles {
    <#
        Copies every UNTRACKED .env* file found at repo root and in each apps/<app> dir
        from $RepoRoot into $DestinationRoot, preserving relative paths.
        Tracked env files (.env.example, .env.production ...) already exist via git checkout.
        Returns list of copied relative paths (forward slashes).
    #>
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [Parameter(Mandatory = $true)][string]$DestinationRoot
    )

    $tracked = @{}
    & git -C $RepoRoot ls-files | ForEach-Object { $tracked[$_] = $true }

    $repoFull = (Get-Item -LiteralPath $RepoRoot).FullName.TrimEnd('\')

    $scanDirs = @(Get-Item -LiteralPath $RepoRoot)
    $appsDir = Join-Path $RepoRoot 'apps'
    if (Test-Path -LiteralPath $appsDir) {
        $scanDirs += @(Get-ChildItem -LiteralPath $appsDir -Force -Directory)
    }

    $copied = @()
    foreach ($dir in $scanDirs) {
        $envFiles = @(Get-ChildItem -LiteralPath $dir.FullName -Force -File -Filter '.env*' -ErrorAction SilentlyContinue)
        foreach ($file in $envFiles) {
            $relLocal = $file.FullName.Substring($repoFull.Length + 1)   # e.g. apps\api\.env
            $relFwd   = $relLocal.Replace('\', '/')
            if (-not $tracked.ContainsKey($relFwd)) {
                $destFile = Join-Path $DestinationRoot $relLocal
                $destDir  = Split-Path -Parent $destFile
                if (-not (Test-Path -LiteralPath $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item -LiteralPath $file.FullName -Destination $destFile -Force
                $copied += $relFwd
            }
        }
    }
    return @($copied)
}

function New-JunctionLink {
    <#
        Creates an NTFS junction at $Destination pointing to $Source.
        Returns 'linked' | 'exists' | 'missing-source' | 'failed'.
    #>
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )
    if (-not (Test-Path -LiteralPath $Source))      { return 'missing-source' }
    if (Test-Path -LiteralPath $Destination)        { return 'exists' }
    try {
        New-Item -ItemType Junction -Path $Destination -Value $Source -ErrorAction Stop | Out-Null
        return 'linked'
    } catch {
        Write-Warn2 "Junction failed for '$Destination': $($_.Exception.Message)"
        return 'failed'
    }
}

function Remove-JunctionLink {
    <#
        Removes ONLY the junction link itself, never its target content.
    #>
    param([Parameter(Mandatory = $true)][string]$Destination)
    if (-not (Test-Path -LiteralPath $Destination)) { return $false }
    $item = Get-Item -LiteralPath $Destination -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        [IO.Directory]::Delete($item.FullName)
        return $true
    }
    return $false
}
