!macro customInit
  ; Force close the backend process before installation starts
  nsExec::Exec 'taskkill /F /IM westbudget-backend.exe'
!macroend

!macro customUnInstall
  ; Force close the backend process before uninstallation
  nsExec::Exec 'taskkill /F /IM westbudget-backend.exe'
!macroend
