# test-endpoints.ps1 - Prueba los 5 endpoints de Zaguan
$BASE = "http://localhost:3000"
$ErrorActionPreference = "Stop"

function Req {
    param($method, $url, $body = $null, $hdrs = @{})
    $params = @{ Uri = "$BASE$url"; Method = $method; Headers = $hdrs }
    if ($body) {
        $params.ContentType = "application/json"
        $params.Body = $body | ConvertTo-Json -Compress
    }
    try {
        Invoke-RestMethod @params
    } catch {
        throw $_
    }
}

Write-Host ""
Write-Host "==================================================="
Write-Host " ZAGUAN AUTH - Test de los 5 endpoints"
Write-Host "==================================================="
Write-Host ""

# 0. HEALTH
Write-Host "[0] GET /health"
$h = Req "GET" "/health"
Write-Host "    OK: $($h | ConvertTo-Json -Compress)"
Write-Host ""

# 1. REGISTER
Write-Host "[1] POST /auth/register"
$reg = Req "POST" "/auth/register" @{ email = "demo@zaguan.dev"; password = "SuperSeguro123" }
Write-Host "    OK: id=$($reg.id)  email=$($reg.email)  role=$($reg.role)"
Write-Host ""

# 1b. REGISTER duplicado - debe dar 409
Write-Host "[1b] POST /auth/register (email duplicado - debe dar 409)"
try {
    Req "POST" "/auth/register" @{ email = "demo@zaguan.dev"; password = "OtraClave999" } | Out-Null
    Write-Host "    FALLO: debia rechazar con 409!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "    OK: HTTP $code (conflicto esperado)"
}
Write-Host ""

# 2. LOGIN
Write-Host "[2] POST /auth/login"
$tokens = Req "POST" "/auth/login" @{ email = "demo@zaguan.dev"; password = "SuperSeguro123" }
$AT = $tokens.accessToken
$RT = $tokens.refreshToken
Write-Host "    OK: accessToken  = $($AT.Substring(0,50))..."
Write-Host "    OK: refreshToken = $($RT.Substring(0,50))..."
Write-Host ""

# 3. ME con token valido
Write-Host "[3] GET /auth/me (con Bearer token)"
$me = Req "GET" "/auth/me" -hdrs @{ Authorization = "Bearer $AT" }
Write-Host "    OK: userId=$($me.userId)  role=$($me.role)"
Write-Host ""

# 3b. ME sin token - debe dar 401
Write-Host "[3b] GET /auth/me (sin token - debe dar 401)"
try {
    Req "GET" "/auth/me" | Out-Null
    Write-Host "    FALLO: debia rechazar con 401!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "    OK: HTTP $code (no autorizado esperado)"
}
Write-Host ""

# 4. REFRESH - rota el token
Write-Host "[4] POST /auth/refresh (rotacion de tokens)"
$refreshed = Req "POST" "/auth/refresh" @{ refreshToken = $RT }
$AT2 = $refreshed.accessToken
$RT2 = $refreshed.refreshToken
Write-Host "    OK: nuevo accessToken  = $($AT2.Substring(0,50))..."
Write-Host "    OK: nuevo refreshToken = $($RT2.Substring(0,50))..."
Write-Host ""

# 4b. REFRESH con token ya usado - debe dar 401
Write-Host "[4b] POST /auth/refresh (token ya revocado - debe dar 401)"
try {
    Req "POST" "/auth/refresh" @{ refreshToken = $RT } | Out-Null
    Write-Host "    FALLO: debia rechazar el token revocado!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "    OK: HTTP $code (rotacion funciona: token anterior revocado)"
}
Write-Host ""

# 5. LOGOUT
Write-Host "[5] POST /auth/logout"
$logoutBody = @{ refreshToken = $RT2 } | ConvertTo-Json -Compress
try {
    $resp = Invoke-WebRequest -Uri "$BASE/auth/logout" -Method POST `
        -ContentType "application/json" -Body $logoutBody
    Write-Host "    OK: HTTP $($resp.StatusCode) (token revocado)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 204) {
        Write-Host "    OK: HTTP 204 (logout exitoso)"
    } else {
        Write-Host "    ERROR inesperado: HTTP $code"
    }
}
Write-Host ""
Write-Host "==================================================="
Write-Host " TODOS LOS TESTS COMPLETADOS"
Write-Host "==================================================="
Write-Host ""
