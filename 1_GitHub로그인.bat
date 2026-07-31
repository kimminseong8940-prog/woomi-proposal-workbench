@echo off
chcp 65001 >nul
echo.
echo  [1/2] GitHub 로그인 (브라우저가 열리면 안내에 따라 로그인)
echo.
set "PATH=%ProgramFiles%\GitHub CLI;%PATH%"
gh auth login -p https -w
echo.
pause
