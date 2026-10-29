param(
    [string]$ArtifactDirectory = 'D:\safe-output\teachify-instructor-release-ee6c2a7',
    [string]$ExpectedBaseSha = 'ee6c2a7ba6ac43b5a6a108bf4a8a2e7e200cda77',
    [string]$ExpectedSourceSha = '7b0ef7af16cfec3d110fb2db694995a2a30b90b0',
    [string]$SshKey = (Join-Path $env:USERPROFILE '.ssh\id_ed25519_techify'),
    [string]$SshTarget = 'deplo@187.127.92.237'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Equal([string]$Actual, [string]$Expected, [string]$Message) {
    if ($Actual -cne $Expected) {
        throw "$Message`nExpected: $Expected`nActual:   $Actual"
    }
}

function Invoke-Git([string[]]$GitArgs) {
    $result = & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
    }
    return ($result -join "`n").Trim()
}

$repo = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) {
    throw 'Run this script from inside the Teachify repository.'
}

$branch = Invoke-Git @('-C', $repo, 'rev-parse', '--abbrev-ref', 'HEAD')
Assert-Equal $branch 'deploy' 'Unexpected local branch.'
Assert-Equal (Invoke-Git @('-C', $repo, 'rev-parse', 'HEAD')) $ExpectedSourceSha 'Local source commit changed.'
Assert-Equal (Invoke-Git @('-C', $repo, 'rev-parse', 'origin/deploy')) $ExpectedBaseSha 'origin/deploy changed; rebuild and re-review the release.'
$remoteRef = & git -C $repo ls-remote --exit-code origin refs/heads/deploy
if ($LASTEXITCODE -ne 0) {
    throw "Could not verify origin/deploy without changing local refs (exit code $LASTEXITCODE)."
}
$remoteSha = (($remoteRef | Select-Object -First 1) -split '\s+')[0]
Assert-Equal $remoteSha $ExpectedBaseSha 'origin/deploy moved; rebuild and re-review the release.'

$manifestPath = Join-Path $ArtifactDirectory 'release-manifest.txt'
$checksumsPath = Join-Path $ArtifactDirectory 'SHA256SUMS.txt'
$migrationArchive = Join-Path $ArtifactDirectory '01-instructor-migrations.tar'
$applicationArchive = Join-Path $ArtifactDirectory '02-instructor-application.tar'
foreach ($path in @($manifestPath, $checksumsPath, $migrationArchive, $applicationArchive)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required release artifact is missing: $path"
    }
}

$manifest = Get-Content -LiteralPath $manifestPath
Assert-Equal ($manifest | Where-Object { $_ -like 'Base revision:*' } | ForEach-Object { ($_ -split ': ', 2)[1] }) $ExpectedBaseSha 'Manifest base revision does not match the target.'
Assert-Equal ($manifest | Where-Object { $_ -like 'Local feature candidate source:*' } | ForEach-Object { ($_ -split ': ', 2)[1] }) $ExpectedSourceSha 'Manifest source revision does not match the candidate.'

$expectedPaths = @($manifest | Where-Object { $_ -match '^apps/' } | Sort-Object -Unique)
if ($expectedPaths.Count -ne 56) {
    throw "Manifest must contain exactly 56 paths; found $($expectedPaths.Count)."
}
$protectedServerPaths = @(
    'apps/api/app/Http/Controllers/Api/v1/Tenant/TenantAuthController.php',
    'apps/web/src/components/auth/ProtectedRoute.tsx',
    'apps/web/src/components/auth/TenantGuestRoute.tsx',
    'apps/web/src/providers/AuthProvider.tsx',
    'apps/web/src/stores/auth.store.ts'
)
if ($expectedPaths | Where-Object { $_ -cin $protectedServerPaths }) {
    throw 'The release manifest includes a protected unrelated server modification.'
}
if (@($manifest | Where-Object { $_ -match '^apps/' }).Count -ne $expectedPaths.Count) {
    throw 'Manifest contains duplicate application paths.'
}
if ($expectedPaths | Where-Object { $_ -match '(^|/)\.\.?(/|$)|\\|:' }) {
    throw 'Manifest contains a non-canonical or unsafe path.'
}

$checklistPath = Join-Path $repo 'apps\INSTRUCTOR_RELEASE_CHECKLIST.md'
if (-not (Test-Path -LiteralPath $checklistPath -PathType Leaf)) {
    throw "The reviewed Instructor allowlist is missing: $checklistPath"
}
$inAllowlist = $false
$allowlistPaths = @(
    foreach ($line in Get-Content -LiteralPath $checklistPath) {
        if ($line -match '^### Required (tracked modifications|untracked new files)') {
            $inAllowlist = $true
            continue
        }
        if ($line -match '^### ') {
            $inAllowlist = $false
        }
        if ($inAllowlist -and $line -match '^- `([^`]+)`$') {
            $Matches[1]
        }
    }
)
$allowlistPaths = @($allowlistPaths | Sort-Object -Unique)
if ($allowlistPaths.Count -ne 56 -or (Compare-Object -CaseSensitive $allowlistPaths $expectedPaths)) {
    throw 'Manifest does not exactly match the reviewed 56-file Instructor allowlist.'
}
foreach ($path in $expectedPaths) {
    if (-not (Test-Path -LiteralPath (Join-Path $repo ($path -replace '/', '\')) -PathType Leaf)) {
        throw "Allowlisted source file is missing from the local worktree: $path"
    }
}

$sums = @{}
foreach ($line in Get-Content -LiteralPath $checksumsPath) {
    if ($line -notmatch '^([0-9A-Fa-f]{64})\s+(.+)$') {
        throw 'Malformed SHA256SUMS.txt entry.'
    }
    $sums[$Matches[2].TrimStart('*')] = $Matches[1].ToUpperInvariant()
}
if ($sums.Count -ne 3) {
    throw "SHA256SUMS.txt must contain exactly three entries; found $($sums.Count)."
}

foreach ($name in @('01-instructor-migrations.tar', '02-instructor-application.tar', 'release-manifest.txt')) {
    if (-not $sums.ContainsKey($name)) {
        throw "Checksum entry is missing for $name."
    }
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $ArtifactDirectory $name)).Hash
    Assert-Equal $actualHash $sums[$name] "SHA256 mismatch for $name."
}

$migrationPaths = @(& tar.exe -tf $migrationArchive)
if ($LASTEXITCODE -ne 0) {
    throw 'Could not list the migrations archive.'
}
$applicationPaths = @(& tar.exe -tf $applicationArchive)
if ($LASTEXITCODE -ne 0) {
    throw 'Could not list the application archive.'
}
if ($migrationPaths.Count -ne 2 -or $applicationPaths.Count -ne 54) {
    throw "Archive split is invalid: migrations=$($migrationPaths.Count), application=$($applicationPaths.Count)."
}

$rawArchivePaths = @($migrationPaths + $applicationPaths)
$allArchivePaths = @($rawArchivePaths | Sort-Object -Unique)
if ($allArchivePaths.Count -ne 56 -or
    $rawArchivePaths.Count -ne 56 -or
    (Compare-Object -CaseSensitive $expectedPaths $allArchivePaths)) {
    throw 'Archive paths do not exactly match the 56-path manifest.'
}
if ($migrationPaths[0] -notmatch '2026_10_26_000001_add_instructor_identity' -or
    $migrationPaths[1] -notmatch '2026_10_28_000001_add_instructor_assignment_managed') {
    throw 'The two migrations are not packaged in the required identity-then-assignment order.'
}
if ($allArchivePaths -contains 'apps/web/src/config/env.ts') {
    throw 'The protected custom-domain configuration must not be replaced by this release.'
}

$verifyDirectory = Join-Path $env:TEMP ('teachify-instructor-verify-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $verifyDirectory | Out-Null
try {
    & tar.exe -xf $migrationArchive -C $verifyDirectory
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not extract the migrations archive into the temporary verification directory.'
    }
    & tar.exe -xf $applicationArchive -C $verifyDirectory
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not extract the application archive into the temporary verification directory.'
    }

    foreach ($path in $expectedPaths) {
        $relativePath = $path -replace '/', '\'
        $archivedFile = Join-Path $verifyDirectory $relativePath
        $sourceFile = Join-Path $repo $relativePath
        if (-not (Test-Path -LiteralPath $archivedFile -PathType Leaf)) {
            throw "Archive is missing expected file: $path"
        }
        Assert-Equal (Get-FileHash -Algorithm SHA256 -LiteralPath $archivedFile).Hash `
            (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceFile).Hash `
            "Archive content differs from the allowlisted worktree file: $path"
    }

    $extractedPaths = @(
        Get-ChildItem -LiteralPath $verifyDirectory -File -Recurse |
            ForEach-Object { $_.FullName.Substring($verifyDirectory.Length + 1).Replace('\', '/') } |
            Sort-Object -Unique
    )
    $expectedRelativePaths = @($expectedPaths | Sort-Object -Unique)
    if ($extractedPaths.Count -ne 56 -or
        (Compare-Object -CaseSensitive $expectedRelativePaths $extractedPaths)) {
        throw 'Extracted archive contains unexpected or missing files.'
    }
}
finally {
    Remove-Item -LiteralPath $verifyDirectory -Recurse -Force
}

$baseEnv = Invoke-Git @('-C', $repo, 'show', "${ExpectedBaseSha}:apps/web/src/config/env.ts")
if (-not $baseEnv.Contains('return `${protocol}//${hostname}`;')) {
    throw 'The target base commit does not contain the required same-origin return.'
}
$baseEnvLines = $baseEnv -split "`n"
$workingEnvLines = [System.IO.File]::ReadAllLines((Join-Path $repo 'apps\web\src\config\env.ts'))
if ($baseEnvLines.Count -lt 108 -or
    $baseEnvLines[107].Trim() -cne 'return `${protocol}//${hostname}`;' -or
    $workingEnvLines.Count -lt 108 -or
    $workingEnvLines[107].Trim() -cne 'return `${protocol}//${hostname}`;') {
    throw 'The current working tree does not contain the required same-origin return.'
}

Write-Output "ARTIFACTS_VALID base=$ExpectedBaseSha source=$ExpectedSourceSha paths=56 migrations=2 application=54"
Write-Output 'SAME_ORIGIN_FIX=verified; env.ts excluded from release archives'

if (-not (Test-Path -LiteralPath $SshKey -PathType Leaf)) {
    throw "SSH key is unavailable at the configured path: $SshKey"
}

$remoteScript = @'
set -euo pipefail
cd /var/www/teachify
printf 'SERVER_SHA=%s\n' "$(git rev-parse HEAD)"
git status --short --untracked-files=all | while IFS= read -r line; do printf 'DIRTY=%s\n' "${line:3}"; done
for p in /var/www/teachify/current /var/www/teachify/releases /var/www/teachify/shared; do
  if [ -L "$p" ]; then printf 'PATH=%s symlink=%s\n' "$p" "$(readlink "$p")"
  elif [ -e "$p" ]; then printf 'PATH=%s exists\n' "$p"
  else printf 'PATH=%s absent\n' "$p"; fi
done
'@
$remoteScript = $remoteScript -replace "`r", ''
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remoteScript))
$remoteCommand = "printf '%s' '$encoded' | base64 -d | bash"
$sshOutput = & ssh.exe -i $SshKey -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 $SshTarget $remoteCommand
if ($LASTEXITCODE -ne 0) {
    throw "Read-only server preflight failed with exit code $LASTEXITCODE."
}
$sshOutput | ForEach-Object { Write-Output $_ }

$serverSha = ($sshOutput | Where-Object { $_ -like 'SERVER_SHA=*' } | Select-Object -First 1) -replace '^SERVER_SHA=', ''
Assert-Equal $serverSha $ExpectedBaseSha 'Server checkout is not on the release base revision.'

$dirtyPaths = @($sshOutput | Where-Object { $_ -like 'DIRTY=*' } | ForEach-Object { $_ -replace '^DIRTY=', '' } | Sort-Object -CaseSensitive)
$preservedPaths = @($protectedServerPaths | Sort-Object -CaseSensitive)
if (Compare-Object -CaseSensitive $preservedPaths $dirtyPaths) {
    throw 'Server dirty-file state changed; stop and review before any deployment.'
}

if ($sshOutput -match 'PATH=/var/www/teachify/current absent' -or
    $sshOutput -match 'PATH=/var/www/teachify/releases absent' -or
    $sshOutput -match 'PATH=/var/www/teachify/shared absent') {
    throw 'No verified versioned release/switch layout exists; this script will not write into live application paths.'
}

throw 'Preflight passed, but deployment is intentionally disabled until the operations owner verifies a rollback-safe service route and the DBA recovery gate is satisfied.'
