param(
  [string]$SonarQubeUrl = "http://192.168.2.50:9005",
  [string]$ProjectKey = "xConfig"
)

# Read token from codex config using same logic as run-xconfig-sonarqube.ps1
$token = ""
$codexPaths = @(
    (Join-Path $env:USERPROFILE ".codex\config.toml")
)

foreach ($path in $codexPaths) {
    if (-not (Test-Path $path)) { continue }
    $content = Get-Content $path -Raw
    $sectionMatch = [regex]::Match($content, '(?ms)^\[mcp_servers\.sonarqube\]\s*(?<section>.*?)(?=^\[|\z)')
    if (-not $sectionMatch.Success) { continue }
    $envMatch = [regex]::Match($sectionMatch.Groups["section"].Value, 'env\s*=\s*\{(?<body>[^}]*)\}')
    if (-not $envMatch.Success) { continue }
    foreach ($m in [regex]::Matches($envMatch.Groups["body"].Value, '([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"((?:\\.|[^"\\])*)"')) {
        $key = $m.Groups[1].Value
        $val = $m.Groups[2].Value -replace '\\n','`n' -replace '\\t','`t' -replace '\\"','"' -replace '\\\\','\'
        if ($key -eq "SONAR_TOKEN") { $token = $val }
        if ($key -eq "SONARQUBE_TOKEN") { $token = $val }
    }
    if ($token) { break }
}

if (-not $token) {
    Write-Error "SonarQube token not found"
    exit 1
}

$headers = @{ "Authorization" = "Bearer $token" }
$issuesUrl = "$SonarQubeUrl/api/issues/search?projects=$ProjectKey&resolved=false&ps=500"
$issues = Invoke-RestMethod -Uri $issuesUrl -Headers $headers -Method Get

Write-Host "Total open issues: $($issues.total)"
foreach ($issue in $issues.issues) {
    Write-Host "[$($issue.severity)] $($issue.type): $($issue.message) | $($issue.component)@$($issue.line)"
}