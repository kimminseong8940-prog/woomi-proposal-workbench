@echo off
chcp 65001 >nul
set "PATH=%ProgramFiles%\GitHub CLI;%PATH%"
echo.
echo  배포 중... (끝나면 주소가 파일로도 저장됩니다)
echo.
python C:\Users\user\AppData\Local\Temp\deploy_woomi_pages2.py
echo.
if exist "%~dp0팀공유_주소.txt" (
  echo  주소 파일 여는 중...
  start "" "%~dp0팀공유_주소.txt"
)
pause
