param(
  [string]$SonarQubeUrl = $env:SONARQUBE_URL,
  [string]$SonarQubeToken = $(if ($env:SONARQUBE_TOKEN) { $env:SONARQUBE_TOKEN } else { $env:SONAR_TOKEN }),
  [string]$ProjectKey = "xConfig",
  [switch]$SkipServerConfig,
  [switch]$SkipAnalysis
)

$ErrorActionPreference = "Stop"

function Get-CodexConfigPaths {
  $paths = @()

  if ($env:CODEX_HOME) {
    $paths += Join-Path $env:CODEX_HOME "config.toml"
  }

  if ($env:USERPROFILE) {
    $paths += Join-Path $env:USERPROFILE ".codex\config.toml"
  }

  $paths | Select-Object -Unique
}

function ConvertFrom-TomlInlineString {
  param([string]$Value)

  return $Value `
    -replace '\\n', "`n" `
    -replace '\\r', "`r" `
    -replace '\\t', "`t" `
    -replace '\\"', '"' `
    -replace '\\\\', '\'
}

function Read-CodexSonarQubeEnv {
  foreach ($path in Get-CodexConfigPaths) {
    if (-not (Test-Path -LiteralPath $path)) {
      continue
    }

    $content = Get-Content -LiteralPath $path -Raw
    $sectionMatch = [regex]::Match(
      $content,
      '(?ms)^\[mcp_servers\.sonarqube\]\s*(?<section>.*?)(?=^\[|\z)'
    )

    if (-not $sectionMatch.Success) {
      continue
    }

    $envMatch = [regex]::Match($sectionMatch.Groups["section"].Value, 'env\s*=\s*\{(?<body>[^}]*)\}')
    if (-not $envMatch.Success) {
      $envMatch = [regex]::Match(
        $content,
        '(?ms)^\[mcp_servers\.sonarqube\.env\]\s*(?<body>.*?)(?=^\[|\z)'
      )
    }

    if (-not $envMatch.Success) {
      continue
    }

    $result = @{}
    foreach ($match in [regex]::Matches($envMatch.Groups["body"].Value, '([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"((?:\\.|[^"\\])*)"')) {
      $result[$match.Groups[1].Value] = ConvertFrom-TomlInlineString $match.Groups[2].Value
    }

    if ($result.Count -gt 0) {
      $result["CODEX_CONFIG_PATH"] = $path
      return $result
    }
  }

  return @{}
}

function Invoke-Scanner {
  param(
    [string]$BaseUrl,
    [string]$Token
  )

  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  $previousHostUrl = $env:SONAR_HOST_URL
  $previousToken = $env:SONAR_TOKEN

  try {
    $env:SONAR_HOST_URL = $BaseUrl
    $env:SONAR_TOKEN = $Token

    $scanner = Get-Command sonar-scanner -ErrorAction SilentlyContinue
    if ($scanner) {
      Write-Host "Running SonarQube analysis with sonar-scanner on PATH."
      & $scanner.Source "-Dsonar.qualitygate.wait=true"
      if ($LASTEXITCODE -ne 0) {
        throw "SonarQube scanner failed with exit code $LASTEXITCODE."
      }
      return
    }

    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
      Write-Host "Running SonarQube analysis with Docker sonar-scanner-cli."
      & $docker.Source run --rm --pull=always `
        -e "SONAR_HOST_URL=$BaseUrl" `
        -e "SONAR_TOKEN=$Token" `
        -v "$($repoRoot):/usr/src" `
        sonarsource/sonar-scanner-cli `
        "-Dsonar.qualitygate.wait=true"
      if ($LASTEXITCODE -ne 0) {
        throw "SonarQube Docker scanner failed with exit code $LASTEXITCODE."
      }
      return
    }

    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if ($npx) {
      Write-Host "Running SonarQube analysis with npx sonarqube-scanner."
      & $npx.Source --yes sonarqube-scanner "-Dsonar.qualitygate.wait=true"
      if ($LASTEXITCODE -ne 0) {
        throw "SonarQube npx scanner failed with exit code $LASTEXITCODE."
      }
      return
    }

    throw "No SonarQube scanner runner is available. Install sonar-scanner, Docker, or npm/npx."
  } finally {
    $env:SONAR_HOST_URL = $previousHostUrl
    $env:SONAR_TOKEN = $previousToken
  }
}

$codexSonarEnv = Read-CodexSonarQubeEnv
$tokenSource = "environment"

if (-not $SonarQubeUrl -and $codexSonarEnv["SONARQUBE_URL"]) {
  $SonarQubeUrl = $codexSonarEnv["SONARQUBE_URL"]
  $tokenSource = "codex-config"
}

if (-not $SonarQubeToken -and $codexSonarEnv["SONARQUBE_TOKEN"]) {
  $SonarQubeToken = $codexSonarEnv["SONARQUBE_TOKEN"]
  $tokenSource = "codex-config"
}

if (-not $SonarQubeUrl) {
  throw "SONARQUBE_URL is missing. Set it in the environment or in ~/.codex/config.toml under [mcp_servers.sonarqube].env."
}

if (-not $SonarQubeToken) {
  throw "SONARQUBE_TOKEN is missing. Set it in the environment or in ~/.codex/config.toml under [mcp_servers.sonarqube].env."
}

$baseUrl = $SonarQubeUrl.TrimEnd("/")
Write-Host "Using SonarQube server $baseUrl (credentials source: $tokenSource)."

if (-not $SkipServerConfig) {
  & (Join-Path $PSScriptRoot "apply-xconfig-server-config.ps1") `
    -SonarQubeUrl $baseUrl `
    -SonarQubeToken $SonarQubeToken `
    -ProjectKey $ProjectKey | Out-Host
}

if (-not $SkipAnalysis) {
  Invoke-Scanner -BaseUrl $baseUrl -Token $SonarQubeToken
}
