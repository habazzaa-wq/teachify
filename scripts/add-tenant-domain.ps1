param(
    [Parameter(Mandatory, Position = 0)]
    [string]$Domain,

    [Parameter()]
    [int]$Port = 3000,

    [Parameter()]
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$entry = "127.0.0.1`t$Domain"

# Check if already in hosts
$hostsContent = Get-Content -LiteralPath $HostsFile -Raw -ErrorAction SilentlyContinue
if ($hostsContent -match [regex]::Escape($Domain)) {
    Write-Host "✓ $Domain already in hosts" -ForegroundColor Green
} else {
    Write-Host "→ Adding $Domain to hosts file..." -ForegroundColor Yellow
    try {
        # Try direct append (may fail without admin)
        Add-Content -LiteralPath $HostsFile -Value $entry -ErrorAction Stop
        Write-Host "✓ Added $Domain to hosts" -ForegroundColor Green
    } catch {
        # Elevate and retry
        Write-Host "  Admin privileges required. Requesting elevation..." -ForegroundColor Yellow
        $script = "Add-Content -LiteralPath '$HostsFile' -Value '$entry' -Force"
        $proc = Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -Command $script" -PassThru -Wait
        if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne $null) {
            Write-Error "Failed to add $Domain to hosts. Run as Administrator manually."
            exit 1
        }
        Write-Host "✓ Added $Domain to hosts" -ForegroundColor Green
    }
}

if ($OpenBrowser) {
    $url = "http://${Domain}:${Port}"
    Write-Host "→ Opening $url" -ForegroundColor Cyan
    Start-Process $url
}
