<#
.SYNOPSIS
Kazka -- Repository Cleaner
Rimuove file duplicati e non necessari dalla repository.
#>

$root = Split-Path -Parent $PSCommandPath
Set-Location -LiteralPath $root

$removed = @()

function Remove-IfExists($path, $reason) {
    if (Test-Path -LiteralPath $path) {
        if (Test-Path -LiteralPath $path -PathType Container) {
            Remove-Item -Recurse -Force -LiteralPath $path
        } else {
            Remove-Item -Force -LiteralPath $path
        }
        $script:removed += "$path - $reason"
    }
}

# --- 1. kazka-app-final/ -- vecchio backup, tutto gia duplicato nella root
Remove-IfExists "$root\kazka-app-final" "Backup obsoleto, contenuti gia nella root"

# --- 2. app/js/*.js -- file JS non caricati da nessuna pagina HTML (tutto inline in app.html)
if (Test-Path -LiteralPath "$root\app\js") {
    Get-ChildItem -LiteralPath "$root\app\js" -Filter *.js | ForEach-Object {
        Remove-IfExists $_.FullName "JS orfano, non referenziato da alcun HTML"
    }
    # rimuovi la cartella se vuota
    if (-not (Get-ChildItem -LiteralPath "$root\app\js" -ErrorAction SilentlyContinue)) {
        Remove-Item -Force -LiteralPath "$root\app\js"
    }
}

# --- Report ---
Write-Output "`n========== KAZKA CLEANER REPORT =========="
if ($removed.Count -eq 0) {
    Write-Output "Nessun file da rimuovere."
} else {
    Write-Output "Rimossi $($removed.Count) elementi:"
    $removed | ForEach-Object { Write-Output "  - $_" }
}

Write-Output "`nStruttura attuale:"
Get-ChildItem -LiteralPath $root -Directory | Where-Object { $_.Name -notmatch 'node_modules|\.git|github' } | ForEach-Object { Write-Output "  [+] $($_.Name)" }
Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Extension -match '\.(html|json|js|yml|yaml|md|config|gitignore|ps1)' } | ForEach-Object { Write-Output "  [f] $($_.Name)" }

Write-Output "`nSuggerimento: se non usi piu la cartella test/ per debug locale,"
Write-Output "  esegui: Remove-Item -Recurse -Force '$root\test'"
Write-Output "=========================================="
