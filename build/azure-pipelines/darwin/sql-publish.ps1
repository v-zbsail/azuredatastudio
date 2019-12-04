. build/azure-pipelines/win32/exec.ps1
$ErrorActionPreference = "Stop"

$VersionJson = Get-Content -Raw -Path "$artifactsDir\version.json" | ConvertFrom-Json
$Version = $VersionJson.version
$Quality = $VersionJson.quality
$CommitId = $VersionJson.commit

$ZipName = "azuredatastudio-darwin.zip"
$Zip = "$artifactsDir\$ZipName"

node $sourcesDir\build\azure-pipelines\common\publish.js $Quality darwin archive $ZipName $Version true $Zip $CommitId
