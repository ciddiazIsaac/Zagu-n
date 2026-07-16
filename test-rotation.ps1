# test-rotation.ps1 - Verifica que el token rotado es rechazado
$BASE = "http://localhost:3000"

# Login
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"demo@zaguan.dev","password":"SuperSeguro123"}'
$RT = $login.refreshToken
Write-Host "Login OK. RT original: $($RT.Substring(0,40))..."

# Primer refresh - consume RT original
$r1 = Invoke-RestMethod -Uri "$BASE/auth/refresh" -Method POST `
    -ContentType "application/json" `
    -Body "{`"refreshToken`":`"$RT`"}"
Write-Host "Primer refresh OK. Nuevo RT: $($r1.refreshToken.Substring(0,40))..."

# Segundo refresh con RT original (ya revocado)
Write-Host "Intentando refresh con RT revocado..."
try {
    $r2 = Invoke-RestMethod -Uri "$BASE/auth/refresh" -Method POST `
        -ContentType "application/json" `
        -Body "{`"refreshToken`":`"$RT`"}" `
        -ErrorAction Stop
    Write-Host "FALLO: acepto el token revocado! -> $($r2 | ConvertTo-Json)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "CORRECTO: Token revocado rechazado - HTTP $code"
}

# Logout con el nuevo RT
Write-Host "Probando logout con HttpWebRequest..."
$wc = [System.Net.WebClient]::new()
$wc.Headers["Content-Type"] = "application/json"
try {
    $resp = $wc.UploadString("$BASE/auth/logout", "POST", "{`"refreshToken`":`"$($r1.refreshToken)`"}")
    Write-Host "Logout OK: respuesta = '$resp'"
} catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    if ($code -eq 204) {
        Write-Host "Logout OK: HTTP 204 No Content"
    } else {
        Write-Host "Logout error HTTP $code : $($_.Exception.Message)"
    }
}
