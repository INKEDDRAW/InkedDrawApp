@echo off
setlocal enabledelayedexpansion

echo 🚀 InkedDraw Google Vision AI Setup
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the InkedDrawApp root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: Backend directory not found
    pause
    exit /b 1
)

echo 📁 Creating backend config directory...
if not exist "backend\config" mkdir backend\config

echo.
echo 🔑 Google Cloud Service Account Key Setup
echo =========================================
echo.
echo Please follow these steps:
echo.
echo 1. Go to Google Cloud Console: https://console.cloud.google.com/
echo 2. Create a new project (or select existing): 'InkedDraw Vision AI'
echo 3. Enable the Cloud Vision API
echo 4. Create a service account with 'Cloud Vision AI Service Agent' role
echo 5. Download the JSON key file
echo.

REM Check if key file already exists
if exist "backend\config\google-vision-key.json" (
    echo ✅ Found existing Google Vision key file
    set /p replace_key="Do you want to replace it? (y/N): "
    if /i "!replace_key!"=="y" (
        del backend\config\google-vision-key.json
    ) else (
        echo 📝 Using existing key file
    )
)

REM Prompt for key file if it doesn't exist
if not exist "backend\config\google-vision-key.json" (
    echo.
    echo 📥 Please enter the full path to your downloaded Google Cloud service account key file:
    echo    (It should be named something like: inkeddraw-vision-ai-*.json)
    echo.
    set /p key_file_path="Enter the full path to your key file: "
    
    REM Remove quotes if present
    set "key_file_path=!key_file_path:"=!"
    
    if exist "!key_file_path!" (
        copy "!key_file_path!" backend\config\google-vision-key.json >nul
        echo ✅ Key file copied successfully
    ) else (
        echo ❌ Error: Key file not found at: !key_file_path!
        echo Please make sure the file exists and try again
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Configuring environment variables...

REM Get project ID from user input (since we don't have jq on Windows by default)
echo ⚠️  Please enter your Google Cloud Project ID:
echo    (You can find this in the Google Cloud Console or in your key file)
set /p PROJECT_ID="Project ID: "

REM Update .env file
if exist "backend\.env" (
    echo 📝 Updating backend\.env file...
    
    REM Create a temporary file for the updated .env
    type nul > backend\.env.tmp
    
    REM Process each line of the .env file
    for /f "usebackq delims=" %%a in ("backend\.env") do (
        set "line=%%a"
        if "!line:~0,22!"=="GOOGLE_CLOUD_PROJECT_ID" (
            echo GOOGLE_CLOUD_PROJECT_ID=!PROJECT_ID! >> backend\.env.tmp
        ) else if "!line:~0,29!"=="GOOGLE_APPLICATION_CREDENTIALS" (
            echo GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json >> backend\.env.tmp
        ) else (
            echo !line! >> backend\.env.tmp
        )
    )
    
    REM Check if we need to add the Google Cloud variables
    findstr /c:"GOOGLE_CLOUD_PROJECT_ID" backend\.env.tmp >nul
    if errorlevel 1 (
        echo GOOGLE_CLOUD_PROJECT_ID=!PROJECT_ID! >> backend\.env.tmp
    )
    
    findstr /c:"GOOGLE_APPLICATION_CREDENTIALS" backend\.env.tmp >nul
    if errorlevel 1 (
        echo GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json >> backend\.env.tmp
    )
    
    REM Replace the original .env file
    move backend\.env.tmp backend\.env >nul
    
    echo ✅ Environment variables updated
) else (
    echo ❌ Error: backend\.env file not found
    pause
    exit /b 1
)

echo.
echo 🧪 Testing setup...

REM Check if Node.js dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo.
echo ✅ Setup Complete!
echo ==================
echo.
echo 🎯 Next Steps:
echo 1. Start the backend server:
echo    cd backend ^&^& npm run start:dev
echo.
echo 2. Test the Vision API with a real image:
echo    curl -X POST http://localhost:3000/api/v1/scanner/identify-cigar \
echo      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
echo      -F "image=@path/to/cigar-image.jpg"
echo.
echo 3. Check the logs for 'Processing cigar identification with Google Vision AI...'
echo.
echo 📚 For detailed setup instructions, see: GOOGLE_CLOUD_SETUP_GUIDE.md
echo.
echo 🔒 Security Note: Your Google Cloud key is stored in backend\config\ and
echo    is already added to .gitignore to prevent accidental commits.
echo.
pause
