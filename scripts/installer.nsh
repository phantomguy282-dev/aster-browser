!include nsDialogs.nsh
!include LogicLib.nsh
!ifndef BUILD_UNINSTALLER
Var AsterDesktop
Var AsterStart
Var AsterImport
Var AsterDesktopState
Var AsterStartState
Var AsterImportState
!endif
!macro customWelcomePage
 !insertmacro MUI_PAGE_WELCOME
!macroend
!macro customPageAfterChangeDir
 Page custom AsterOptions AsterOptionsLeave
!macroend
!ifndef BUILD_UNINSTALLER
Function AsterOptions
 nsDialogs::Create 1018
 Pop $0
 ${NSD_CreateCheckbox} 0 10u 100% 15u "$(AsterDesktopText)"
 Pop $AsterDesktop
 ${NSD_Check} $AsterDesktop
 ${NSD_CreateCheckbox} 0 35u 100% 15u "$(AsterStartText)"
 Pop $AsterStart
 ${NSD_Check} $AsterStart
 ${NSD_CreateCheckbox} 0 60u 100% 30u "$(AsterImportText)"
 Pop $AsterImport
 nsDialogs::Show
FunctionEnd
Function AsterOptionsLeave
 ${NSD_GetState} $AsterDesktop $AsterDesktopState
 ${NSD_GetState} $AsterStart $AsterStartState
 ${NSD_GetState} $AsterImport $AsterImportState
FunctionEnd
!endif
!macro customInstall
 WriteRegStr HKCU "Software\Classes\AsterHTML" "" "Aster web address"
 WriteRegStr HKCU "Software\Classes\AsterHTML" "URL Protocol" ""
 WriteRegStr HKCU "Software\Classes\AsterHTML\DefaultIcon" "" '$\"$INSTDIR\Aster.exe$\",0'
 WriteRegStr HKCU "Software\Classes\AsterHTML\shell\open\command" "" '$\"$INSTDIR\Aster.exe$\" $\"%1$\"'
 WriteRegStr HKCU "Software\Clients\StartMenuInternet\AsterBrowser" "" "Aster"
 WriteRegStr HKCU "Software\Clients\StartMenuInternet\AsterBrowser\Capabilities" "ApplicationName" "Aster"
 WriteRegStr HKCU "Software\Clients\StartMenuInternet\AsterBrowser\Capabilities" "ApplicationDescription" "Aster web browser"
 WriteRegStr HKCU "Software\Clients\StartMenuInternet\AsterBrowser\Capabilities\URLAssociations" "http" "AsterHTML"
 WriteRegStr HKCU "Software\Clients\StartMenuInternet\AsterBrowser\Capabilities\URLAssociations" "https" "AsterHTML"
 WriteRegStr HKCU "Software\RegisteredApplications" "AsterBrowser" "Software\Clients\StartMenuInternet\AsterBrowser\Capabilities"
 ${IfNot} ${Silent}
  ${If} $AsterDesktopState == ${BST_UNCHECKED}
   Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
  ${EndIf}
  ${If} $AsterStartState == ${BST_UNCHECKED}
   Delete "$newStartMenuLink"
   StrCpy $launchLink "$appExe"
  ${EndIf}
  ${If} $AsterImportState == ${BST_CHECKED}
   FileOpen $0 "$INSTDIR\aster-import-once" w
   FileWrite $0 "1"
   FileClose $0
  ${EndIf}
 ${EndIf}
!macroend
LangString AsterDesktopText 1033 "Create a desktop shortcut"
LangString AsterStartText 1033 "Create a Start menu shortcut"
LangString AsterImportText 1033 "Open the optional browser import wizard on first launch (no data is read automatically)"
LangString AsterDesktopText 1046 "Criar atalho na area de trabalho"
LangString AsterStartText 1046 "Criar atalho no menu Iniciar"
LangString AsterImportText 1046 "Abrir importacao opcional ao iniciar (nenhum dado e lido automaticamente)"
LangString AsterDesktopText 3082 "Crear acceso directo en el escritorio"
LangString AsterStartText 3082 "Crear acceso directo en Inicio"
LangString AsterImportText 3082 "Abrir importacion opcional al iniciar (sin lectura automatica de datos)"
LangString AsterDesktopText 1036 "Creer un raccourci sur le bureau"
LangString AsterStartText 1036 "Creer un raccourci dans le menu Demarrer"
LangString AsterImportText 1036 "Ouvrir l'importation facultative au demarrage (aucune lecture automatique)"
LangString AsterDesktopText 1031 "Desktop-Verknuepfung erstellen"
LangString AsterStartText 1031 "Startmenue-Verknuepfung erstellen"
LangString AsterImportText 1031 "Optionalen Import beim ersten Start oeffnen (kein automatisches Lesen)"
LangString AsterDesktopText 1041 "デスクトップにショートカットを作成"
LangString AsterStartText 1041 "スタートメニューにショートカットを作成"
LangString AsterImportText 1041 "初回起動時に任意のインポートを開く（自動読み取りなし）"
LangString AsterDesktopText 2052 "创建桌面快捷方式"
LangString AsterStartText 2052 "创建开始菜单快捷方式"
LangString AsterImportText 2052 "首次启动时打开可选导入向导（不会自动读取数据）"
LangString AsterDesktopText 1040 "Crea collegamento sul desktop"
LangString AsterStartText 1040 "Crea collegamento nel menu Start"
LangString AsterImportText 1040 "Apri importazione facoltativa al primo avvio (nessuna lettura automatica)"



!macro customUnInstall
 DeleteRegValue HKCU "Software\RegisteredApplications" "AsterBrowser"
 DeleteRegKey HKCU "Software\Clients\StartMenuInternet\AsterBrowser"
 DeleteRegKey HKCU "Software\Classes\AsterHTML"
!macroend

