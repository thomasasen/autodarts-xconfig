param(
  [Parameter(Mandatory = $true)]
  [string]$SonarQubeUrl,

  [Parameter(Mandatory = $true)]
  [string]$SonarQubeToken,

  [string]$ProjectKey = "xConfig",
  [string]$JsProfileName = "autodarts-xconfig JS",
  [switch]$RunAnalysis
)

$ErrorActionPreference = "Stop"

function New-AuthHeader {
  param([string]$Token)

  $pair = "${Token}:"
  $base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
  return @{ Authorization = "Basic $base64" }
}

function Invoke-SonarPost {
  param(
    [hashtable]$Headers,
    [string]$BaseUrl,
    [string]$Path,
    [hashtable]$Body
  )

  Invoke-RestMethod -Headers $Headers -Method Post -Uri "$BaseUrl$Path" -Body $Body | Out-Null
}

function Set-SonarMultiValue {
  param(
    [hashtable]$Headers,
    [string]$BaseUrl,
    [string]$Project,
    [string]$SettingKey,
    [string[]]$Values
  )

  $parts = @(
    "component=$([uri]::EscapeDataString($Project))",
    "key=$([uri]::EscapeDataString($SettingKey))"
  )

  foreach ($value in $Values) {
    $parts += "values=$([uri]::EscapeDataString($value))"
  }

  $body = [string]::Join("&", $parts)

  Invoke-RestMethod `
    -Headers $Headers `
    -Method Post `
    -ContentType "application/x-www-form-urlencoded" `
    -Uri "$BaseUrl/api/settings/set" `
    -Body $body | Out-Null
}

$baseUrl = $SonarQubeUrl.TrimEnd("/")
$headers = New-AuthHeader -Token $SonarQubeToken

$profiles = Invoke-RestMethod -Headers $headers -Uri "$baseUrl/api/qualityprofiles/search?project=$ProjectKey"
$jsProfile = $profiles.profiles | Where-Object { $_.language -eq "js" -and $_.name -eq $JsProfileName } | Select-Object -First 1

if (-not $jsProfile) {
  throw "JS quality profile '$JsProfileName' for project '$ProjectKey' was not found."
}

$profileKey = $jsProfile.key

Set-SonarMultiValue -Headers $headers -BaseUrl $baseUrl -Project $ProjectKey -SettingKey "sonar.exclusions" -Values @(
  "dist/**",
  "src/legacy-backups/**",
  "src/vendors/anime.min.cjs",
  "src/vendors/canvas-confetti.browser.js"
)

Set-SonarMultiValue -Headers $headers -BaseUrl $baseUrl -Project $ProjectKey -SettingKey "sonar.cpd.exclusions" -Values @(
  "src/vendors/**",
  "src/legacy-backups/**"
)

Set-SonarMultiValue -Headers $headers -BaseUrl $baseUrl -Project $ProjectKey -SettingKey "sonar.coverage.exclusions" -Values @(
  "loader/**",
  "scripts/**",
  "src/vendors/**",
  "src/legacy-backups/**"
)

$deactivateRules = @(
  "javascript:S2486",
  "javascript:S7764",
  "javascript:S7785",
  "javascript:S7761",
  "javascript:S1940"
)

foreach ($rule in $deactivateRules) {
  Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/deactivate_rule" -Body @{
    key = $profileKey
    rule = $rule
  }
}

Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/activate_rule" -Body @{
  key = $profileKey
  rule = "javascript:S3776"
  severity = "MAJOR"
  params = "threshold=25"
}

Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/activate_rule" -Body @{
  key = $profileKey
  rule = "javascript:S2004"
  severity = "MAJOR"
  params = "max=4"
}

Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/activate_rule" -Body @{
  key = $profileKey
  rule = "javascript:S6582"
  severity = "MINOR"
}

if ($RunAnalysis) {
  $env:SONAR_HOST_URL = $baseUrl
  $env:SONAR_TOKEN = $SonarQubeToken
  sonar-scanner
}

$summary = [ordered]@{
  project = $ProjectKey
  jsProfile = $JsProfileName
  activeRuleCount = (Invoke-RestMethod -Headers $headers -Uri "$baseUrl/api/qualityprofiles/search?project=$ProjectKey").profiles |
    Where-Object { $_.language -eq "js" -and $_.name -eq $JsProfileName } |
    Select-Object -ExpandProperty activeRuleCount
  settings = Invoke-RestMethod -Headers $headers -Uri "$baseUrl/api/settings/values?component=$ProjectKey&keys=sonar.exclusions,sonar.cpd.exclusions,sonar.coverage.exclusions"
}

$summary | ConvertTo-Json -Depth 8
