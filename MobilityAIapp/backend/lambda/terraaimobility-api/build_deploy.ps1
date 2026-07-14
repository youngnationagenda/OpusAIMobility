$srcDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outZip = Join-Path $srcDir "..\..\aws\lambda\terraaimobility-api-v5.zip"
$outZip = [System.IO.Path]::GetFullPath($outZip)

Write-Host "Source: $srcDir"
Write-Host "Output: $outZip"

if (Test-Path $outZip) { Remove-Item $outZip -Force }

$staging = Join-Path $env:TEMP "lambda_stage_api"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$files = @('index.js','db.js','auth.js','mailer.js','storage.js','sms.js','maps.js','notify.js','admin-handler.js','admin-index.js','seed-config.js','package.json')
foreach ($f in $files) {
    $fp = Join-Path $srcDir $f
    if (Test-Path $fp) {
        Copy-Item $fp $staging
        Write-Host "  + $f"
    } else {
        Write-Warning "MISSING: $f"
    }
}

$nmSrc = Join-Path $srcDir "node_modules"
$nmDst = Join-Path $staging "node_modules"
Write-Host "Copying node_modules..."
Copy-Item $nmSrc $nmDst -Recurse

$devDeps = @('archiver','archiver-utils','lazystream','zip-stream','async','buffer-crc32')
foreach ($d in $devDeps) {
    $p = Join-Path $nmDst $d
    if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "  - removed dev dep: $d" }
}

Write-Host "Creating zip..."
Compress-Archive -Path "$staging\*" -DestinationPath $outZip -Force

Remove-Item $staging -Recurse -Force

$size = [math]::Round((Get-Item $outZip).Length / 1MB, 2)
Write-Host "Done: $outZip ($size MB)"
