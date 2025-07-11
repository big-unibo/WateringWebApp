@echo off
echo Cleaning Node.js project...

REM Remove node_modules
IF EXIST node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
) ELSE (
    echo node_modules folder not found.
)

REM Remove dist
IF EXIST dist (
    echo Removing dist...
    rmdir /s /q dist
) ELSE (
    echo dist folder not found.
)

REM Remove package-lock.json
IF EXIST package-lock.json (
    echo Removing package-lock.json...
    del /f /q package-lock.json
) ELSE (
    echo package-lock.json not found.
)

REM Remove ../watering-platform/package-lock.json
IF EXIST "..\watering-platform\package-lock.json" (
    echo Removing ../watering-platform/package-lock.json...
    del /f /q "..\watering-platform\package-lock.json"
) ELSE (
    echo ../watering-platform/package-lock.json not found.
)

REM Remove ../watering-platform/node_modules
IF EXIST "..\watering-platform\node_modules" (
    echo Removing ../watering-platform/node_modules...
    rmdir /s /q "..\watering-platform\node_modules"
) ELSE (
    echo ../watering-platform/node_modules not found.
)

REM Remove ../watering-platform/abds-watering-chart-components-1.0.0.tgz
IF EXIST "..\watering-platform\abds-watering-chart-components-1.0.0.tgz" (
    echo Removing ../watering-platform/abds-watering-chart-components-1.0.0.tgz...
    del /f /q "..\watering-platform\abds-watering-chart-components-1.0.0.tgz"
) ELSE (
    echo ../watering-platform/abds-watering-chart-components-1.0.0.tgz not found.
)

echo Running npm install...
call npm i
IF ERRORLEVEL 1 (
    echo npm install failed. Aborting.
    pause
    exit /b
)

echo Building the project...
call npm run build
IF ERRORLEVEL 1 (
    echo npm build failed. Aborting.
    pause
    exit /b
)

echo Packing the module...
call npm pack
IF ERRORLEVEL 1 (
    echo npm pack failed. Aborting.
    pause
    exit /b
)

echo Moving .tgz to ../watering-platform...
move abds-watering-chart-components-1.0.0.tgz "..\watering-platform\abds-watering-chart-components-1.0.0.tgz"



echo Cleanup and build complete.
