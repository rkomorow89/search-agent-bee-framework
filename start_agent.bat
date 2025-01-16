@echo off
chcp 65001 >nul

setlocal

:: Definiere den Unix-kompatiblen Pfad zum Agenten-Verzeichnis
set AGENT_DIR=/c/path/to/your/bee-agent-framework-starter

:: Frage den Benutzer nach dem Prompt
set /p prompt="Gib den Prompt für den Agenten ein: "

:: Frage nach der Anzahl der Quellen
set /p num_sources="Wie viele Quellen sollen gefunden werden? (z.B. 5): "

:: Überprüfe, ob die Eingabe eine gültige Zahl ist
for /f "tokens=* delims=0123456789" %%A in ("%num_sources%") do set valid=%%A
if defined valid (
    echo Fehler: Bitte eine gültige Zahl eingeben.
    exit /b
)

:: Setze die Umgebungsvariable für den Prompt und die Quellenanzahl ohne Anführungszeichen
set PROMPT=%prompt%  
set NUM_SOURCES=%num_sources%

:: Starte Git Bash und führe npm exec tsx aus
start "" "C:\Program Files\Git\bin\bash.exe" -c "cd %AGENT_DIR% && npm exec tsx src/agent_llama3.1-8B.ts -- \"%PROMPT%\" %NUM_SOURCES%; exec bash"

endlocal
