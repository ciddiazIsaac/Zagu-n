# test-all.ps1 - Test completo de los 5 endpoints de Zaguan
# Sin emojis, sin Unicode especial, solo ASCII
param()
$BASE = "http://localhost:3000"
$ErrorActionPreference = "Continue"

function Test-Endpoint {
    param($label, $method, $url, $body = $null, $headers = @{}, $expectCode = 200)
    $params = @{ Uri = "$BASE$url"; Method = $method; Headers = $headers }
    if ($body) {
        $params.ContentType = "application/json"
        $params.Body = $body | ConvertTo-Json -Compress
    }
    try {
        $resp = Invoke-RestMethod @params -ErrorAction Stop
        Write-Host "  PASS $label"
        return $resp
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq $expectCode) {
            Write-Host "  PASS $label -> HTTP $code (esperado)"
            return $null
        } else {
            Write-Host "  FAIL $label -> HTTP $code  msg: $($_.Exception.Message)"
            return $null
        }
    }
}

function Post-Raw {
    param($url, $jsonBody)
    $req = [System.Net.WebRequest]::Create("$BASE$url")
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    try {
        $res = $req.GetResponse()
        $code = [int]$res.StatusCode
        $res.Close()
        return $code
    } catch [System.Net.WebException] {
        $code = [int]$_.Exception.Response.StatusCode
        return $code
    }
}

Write-Host ""
Write-Host "==================================================="
Write-Host " ZAGUAN AUTH - Prueba de los 5 endpoints"
Write-Host "==================================================="
Write-Host ""

# 0. HEALTH
Write-Host "[0] GET /health"
$h = Invoke-RestMethod -Uri "$BASE/health" -Method GET
Write-Host "  PASS -> status=$($h.status)  service=$($h.service)"
Write-Host ""

# 1. REGISTER (usuario nuevo)
Write-Host "[1] POST /auth/register"
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "test$ts@zaguan.dev"
$reg = Test-Endpoint "[1] register" "POST" "/auth/register" @{ email = $email; password = "SuperSeguro123" }
if ($reg) { Write-Host "  id=$($reg.id)  email=$($reg.email)  role=$($reg.role)" }
Write-Host ""

# 1b. REGISTER duplicado - debe dar 409
Write-Host "[1b] POST /auth/register (email duplicado - debe dar 409)"
Test-Endpoint "[1b] register-dup" "POST" "/auth/register" @{ email = $email; password = "OtraClave999" } -expectCode 409 | Out-Null
Write-Host ""

# 2. LOGIN
Write-Host "[2] POST /auth/login"
$tokens = Test-Endpoint "[2] login" "POST" "/auth/login" @{ email = $email; password = "SuperSeguro123" }
if (-not $tokens) { Write-Host "  ERROR: login fallo, abortando"; exit 1 }
$AT = $tokens.accessToken
$RT = $tokens.refreshToken
Write-Host "  accessToken  = $($AT.Substring(0,50))..."
Write-Host "  refreshToken = $($RT.Substring(0,50))..."
Write-Host ""

# 3. ME con token valido
Write-Host "[3] GET /auth/me (Bearer token valido)"
$me = Test-Endpoint "[3] me-auth" "GET" "/auth/me" -headers @{ Authorization = "Bearer $AT" }
if ($me) { Write-Host "  userId=$($me.userId)  role=$($me.role)" }
Write-Host ""

# 3b. ME sin token - debe dar 401
Write-Host "[3b] GET /auth/me (sin token - debe dar 401)"
Test-Endpoint "[3b] me-noauth" "GET" "/auth/me" -expectCode 401 | Out-Null
Write-Host ""

# 4. REFRESH - rota el token
Write-Host "[4] POST /auth/refresh (rotacion de tokens)"
$refreshed = Test-Endpoint "[4] refresh" "POST" "/auth/refresh" @{ refreshToken = $RT }
if (-not $refreshed) { Write-Host "  ERROR: refresh fallo, abortando"; exit 1 }
$AT2 = $refreshed.accessToken
$RT2 = $refreshed.refreshToken
Write-Host "  nuevo accessToken  = $($AT2.Substring(0,50))..."
Write-Host "  nuevo refreshToken = $($RT2.Substring(0,50))..."
Write-Host ""

# 4b. REFRESH con token ya revocado - debe dar 401
Write-Host "[4b] POST /auth/refresh (token revocado - debe dar 401)"
Test-Endpoint "[4b] refresh-revoked" "POST" "/auth/refresh" @{ refreshToken = $RT } -expectCode 401 | Out-Null
Write-Host ""

# 5. LOGOUT con nuevo RT
Write-Host "[5] POST /auth/logout"
$logoutJson = "{`"refreshToken`":`"$RT2`"}"
$code = Post-Raw "/auth/logout" $logoutJson
if ($code -eq 204) {
    Write-Host "  PASS -> HTTP 204 No Content (token revocado)"
} else {
    Write-Host "  FAIL -> HTTP $code (esperaba 204)"
}
Write-Host ""

Write-Host "==================================================="
Write-Host " DONE - Todos los tests completados"
Write-Host "==================================================="
Write-Host ""
