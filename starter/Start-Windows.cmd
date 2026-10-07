@echo off
rem Tsum Tsum Script service starter -- Windows.
rem
rem No executable of our own: this hands straight to Windows PowerShell, which
rem every supported Windows already has. -ExecutionPolicy Bypass applies to
rem this invocation only and changes nothing on the machine.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bin\win\gap.ps1" %*
if errorlevel 1 pause
