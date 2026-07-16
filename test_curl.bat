@echo off
echo 1. GET /health
curl.exe -s http://localhost:3000/health
echo.
echo.

echo 2. POST /auth/register
curl.exe -s -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"cto2@zaguan.dev\",\"password\":\"SuperSeguro123\"}"
echo.
echo.

echo 3. POST /auth/login
curl.exe -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"cto2@zaguan.dev\",\"password\":\"SuperSeguro123\"}" > tokens.json
type tokens.json
echo.
echo.

echo 4. GET /auth/me
for /f "tokens=4 delims=\" " %%a in ('findstr /i "accessToken" tokens.json') do set AT=%%a
curl.exe -s -X GET http://localhost:3000/auth/me -H "Authorization: Bearer %AT%"
echo.
echo.

echo 5. POST /auth/refresh
for /f "tokens=8 delims=\" " %%a in ('findstr /i "refreshToken" tokens.json') do set RT=%%a
curl.exe -s -X POST http://localhost:3000/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"%RT%\"}" > tokens2.json
type tokens2.json
echo.
echo.

echo 6. POST /auth/logout
for /f "tokens=8 delims=\" " %%a in ('findstr /i "refreshToken" tokens2.json') do set RT2=%%a
curl.exe -s -i -X POST http://localhost:3000/auth/logout -H "Content-Type: application/json" -d "{\"refreshToken\":\"%RT2%\"}"
echo.
