param(
  [string]$SonarQubeUrl = $env:SONARQUBE_URL,

  [string]$SonarQubeToken = $env:SONARQUBE_TOKEN,

  [string]$ProjectKey = "xConfig",
  [string]$JsProfileName = "autodarts-xconfig JS",
  [string]$QualityGateName = "autodarts-xconfig",
  [switch]$RunAnalysis
)

$ErrorActionPreference = "Stop"

if (-not $SonarQubeUrl) {
  throw "SONARQUBE_URL must be set."
}

if (-not $SonarQubeToken) {
  throw "SONARQUBE_TOKEN must be set."
}

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

function Invoke-SonarGet {
  param(
    [hashtable]$Headers,
    [string]$BaseUrl,
    [string]$Path
  )

  Invoke-RestMethod -Headers $Headers -Uri "$BaseUrl$Path"
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

function Set-SonarGateCondition {
  param(
    [hashtable]$Headers,
    [string]$BaseUrl,
    [string]$GateName,
    [string]$Metric,
    [string]$Op,
    [string]$ErrorThreshold
  )

  $gate = Invoke-SonarGet `
    -Headers $Headers `
    -BaseUrl $BaseUrl `
    -Path "/api/qualitygates/show?name=$([uri]::EscapeDataString($GateName))"

  $existing = @($gate.conditions) | Where-Object { $_.metric -eq $Metric } | Select-Object -First 1

  if ($existing) {
    if ($existing.op -ne $Op -or [string]$existing.error -ne $ErrorThreshold) {
      Invoke-SonarPost -Headers $Headers -BaseUrl $BaseUrl -Path "/api/qualitygates/update_condition" -Body @{
        id = $existing.id
        metric = $Metric
        op = $Op
        error = $ErrorThreshold
      }
    }

    return
  }

  Invoke-SonarPost -Headers $Headers -BaseUrl $BaseUrl -Path "/api/qualitygates/create_condition" -Body @{
    gateName = $GateName
    metric = $Metric
    op = $Op
    error = $ErrorThreshold
  }
}

$baseUrl = $SonarQubeUrl.TrimEnd("/")
$headers = New-AuthHeader -Token $SonarQubeToken

$profiles = Invoke-SonarGet -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/search?project=$ProjectKey"
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
  rule = "javascript:S1128"
}

Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/activate_rule" -Body @{
  key = $profileKey
  rule = "javascript:S125"
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

$gate = $null

try {
  $gate = Invoke-SonarGet `
    -Headers $headers `
    -BaseUrl $baseUrl `
    -Path "/api/qualitygates/show?name=$([uri]::EscapeDataString($QualityGateName))"
} catch {
  $gate = $null
}

if (-not $gate) {
  Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualitygates/create" -Body @{
    name = $QualityGateName
  }
}

Invoke-SonarPost -Headers $headers -BaseUrl $baseUrl -Path "/api/qualitygates/select" -Body @{
  projectKey = $ProjectKey
  gateName = $QualityGateName
}

Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_reliability_rating" -Op "GT" -ErrorThreshold "1"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_security_rating" -Op "GT" -ErrorThreshold "1"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_security_review_rating" -Op "GT" -ErrorThreshold "1"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_maintainability_rating" -Op "GT" -ErrorThreshold "1"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_duplicated_lines_density" -Op "GT" -ErrorThreshold "3"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_blocker_violations" -Op "GT" -ErrorThreshold "0"
Set-SonarGateCondition -Headers $headers -BaseUrl $baseUrl -GateName $QualityGateName -Metric "new_critical_violations" -Op "GT" -ErrorThreshold "0"

if ($RunAnalysis) {
  $env:SONAR_HOST_URL = $baseUrl
  $env:SONAR_TOKEN = $SonarQubeToken
  sonar-scanner
}

$summary = [ordered]@{
  project = $ProjectKey
  jsProfile = $JsProfileName
  qualityGate = $QualityGateName
  activeRuleCount = (Invoke-SonarGet -Headers $headers -BaseUrl $baseUrl -Path "/api/qualityprofiles/search?project=$ProjectKey").profiles |
    Where-Object { $_.language -eq "js" -and $_.name -eq $JsProfileName } |
    Select-Object -ExpandProperty activeRuleCount
  settings = Invoke-SonarGet -Headers $headers -BaseUrl $baseUrl -Path "/api/settings/values?component=$ProjectKey&keys=sonar.exclusions,sonar.cpd.exclusions,sonar.coverage.exclusions"
  gate = Invoke-SonarGet -Headers $headers -BaseUrl $baseUrl -Path "/api/qualitygates/show?name=$([uri]::EscapeDataString($QualityGateName))"
}

$summary | ConvertTo-Json -Depth 8
