param(
  [Parameter(Mandatory=$true, Position=0, HelpMessage="Inserisci il percorso della repository")]
  [string]$RepoPath
)

if (-not (Test-Path -LiteralPath $RepoPath)) {
  Write-Output "ERRORE: Il percorso '$RepoPath' non esiste."
  exit 1
}

Set-Location -LiteralPath $RepoPath
$removed = @()
$errors = @()

function Remove-IfExists($path, $reason) {
  if (Test-Path -LiteralPath $path) {
    try {
      if (Test-Path -LiteralPath $path -PathType Container) {
        Remove-Item -Recurse -Force -LiteralPath $path
      } else {
        Remove-Item -Force -LiteralPath $path
      }
      $script:removed += "$path --- $reason"
    } catch {
      $script:errors += "$path --- $($_.Exception.Message)"
    }
  }
}

Write-Output "`n========== KAZKA REPO CLEANER =========="
Write-Output "Repository: $RepoPath"
Write-Output "========================================"

# ── 1. Old backup kazka-app-final/
Remove-IfExists "$RepoPath\kazka-app-final" "Backup obsoleto (kazka-app-final/)"

# ── 2. app/js/ -- JS orfani non referenziati da nessun HTML
$jsRefs = Select-String -Path "$RepoPath\app\*.html" -Pattern "app/js" -SimpleMatch -ErrorAction SilentlyContinue
if ($null -eq $jsRefs) {
  Remove-IfExists "$RepoPath\app\js" "Cartella JS orfana (non referenziata da HTML)"
}

# ── 3. app/app.html -- redirect sostituito (il vero file e' index.html)
if (Test-Path -LiteralPath "$RepoPath\app\app.html") {
  $content = Get-Content -Raw "$RepoPath\app\app.html"
  if ($content -match "window\.location\.replace") {
    Remove-IfExists "$RepoPath\app\app.html" "Redirect sostituito (index.html e' il primario)"
  }
}

# ── 4. Duplicati in test/ (stessa identica struttura della root)
if (Test-Path -LiteralPath "$RepoPath\test") {
  Write-Output "`n⚠️  Trovata cartella test/ -- contiene copie locali dei file."
  Write-Output "   Per rimuoverla: rimuovi manualmente con Remove-Item -Recurse -Force '$RepoPath\test'"
}

# ── 5. node_modules/, .git/ -- li escludiamo sempre

# ── 6. Report
Write-Output "`n========== REPORT =========="
if ($removed.Count -eq 0) {
  Write-Output "Nessun file da rimuovere. Repository pulita."
} else {
  Write-Output "RIMOSSI $($removed.Count) elementi:"
  $removed | ForEach-Object { Write-Output "  [DEL] $_" }
}

if ($errors.Count -gt 0) {
  Write-Output "`nERRORI ($($errors.Count)):"
  $errors | ForEach-Object { Write-Output "  [ERR] $_" }
}

Write-Output "`nFILE RIMANENTI:"
Get-ChildItem -LiteralPath $RepoPath -Directory | Where-Object { $_.Name -notmatch 'node_modules|\.git|cleaner|github' } | ForEach-Object { Write-Output "  [D] $($_.Name)" }
Get-ChildItem -LiteralPath $RepoPath -File | ForEach-Object { Write-Output "  [F] $($_.Name)" }

Write-Output "`n✅ Pulizia completata."
Write-Output "========================================"
