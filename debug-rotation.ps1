$ErrorActionPreference = 'Stop'
$login = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"test1784226977@zaguan.dev","password":"SuperSeguro123"}'
$RT = $login.refreshToken
Write-Host "RT: $RT"

try {
    # ROTATE THE TOKEN
    $res = Invoke-RestMethod -Uri 'http://localhost:3000/auth/refresh' -Method POST -ContentType 'application/json' -Body "{`"refreshToken`":`"$RT`"}"
    Write-Host 'FIRST REFRESH SUCCESS!'
    
    # ATTEMPT TO REUSE REVOKED TOKEN
    $res2 = Invoke-RestMethod -Uri 'http://localhost:3000/auth/refresh' -Method POST -ContentType 'application/json' -Body "{`"refreshToken`":`"$RT`"}"
    Write-Host 'SECOND REFRESH SUCCESS (BUG!)'
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "HTTP STATUS: $($_.Exception.Response.StatusCode.value__)"
    }
}
