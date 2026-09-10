<#
.SYNOPSIS
  Runs the Flyon email migration on Windows, forwarding every argument to the
  Python script next to this file.

.EXAMPLE
  .\run.ps1 --init-rules --me you@outlook.com --dest-user you@yourbusiness.com.au
  .\run.ps1 --report-senders
  .\run.ps1 --execute --use-review
#>

$ErrorActionPreference = 'Stop'

$python = $null
foreach ($candidate in @('py', 'python3', 'python')) {
    $found = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($found) { $python = $found.Source; break }
}
if (-not $python) {
    Write-Error @'
Python 3 was not found. Install it, then reopen PowerShell:
    winget install Python.Python.3.12
or download it from https://www.python.org/downloads/windows/
'@
}

$script = Join-Path $PSScriptRoot 'migrate_flyon_emails.py'
if (-not (Test-Path $script)) { Write-Error "migrate_flyon_emails.py not found next to run.ps1" }

if (-not $env:MS_CLIENT_ID -and ($args -notcontains '--init-rules') -and ($args -notcontains '--help')) {
    Write-Host 'MS_CLIENT_ID is not set. Set it for this window with:' -ForegroundColor Yellow
    Write-Host '    $env:MS_CLIENT_ID = "<your Azure app registration id>"' -ForegroundColor Yellow
    Write-Host ''
}

# Only the 'py' launcher takes -3; python.exe would reject it.
$leaf = Split-Path $python -Leaf
$prefix = if ($leaf -ieq 'py.exe' -or $leaf -ieq 'py') { @('-3') } else { @() }
& $python @prefix $script @args
exit $LASTEXITCODE
