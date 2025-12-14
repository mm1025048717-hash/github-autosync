Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 获取当前脚本所在目录
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
desktopPath = WshShell.SpecialFolders("Desktop")

' 创建快捷方式
Set shortcut = WshShell.CreateShortcut(desktopPath & "\AutoSync.lnk")
shortcut.TargetPath = scriptPath & "\启动AutoSync.bat"
shortcut.WorkingDirectory = scriptPath
shortcut.WindowStyle = 7
shortcut.IconLocation = scriptPath & "\app\node_modules\electron\dist\electron.exe,0"
shortcut.Description = "GitHub AutoSync - 自动同步代码到 GitHub"
shortcut.Save

MsgBox "桌面快捷方式已创建！", vbInformation, "AutoSync"

