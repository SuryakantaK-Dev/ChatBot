@echo off
echo ========================================
echo    ChatBot Git Setup Script
echo ========================================
echo.

echo Step 1: Installing Git via Chocolatey...
choco install git -y --force

echo.
echo Step 2: Refreshing environment...
refreshenv

echo.
echo Step 3: Checking Git installation...
git --version

echo.
echo Step 4: Setting up Git repository...
git init
git add .
git commit -m "Initial commit: AI Chatbot with Document Preview"

echo.
echo Step 5: Repository setup complete!
echo.
echo Next steps:
echo 1. Create a new repository on GitHub
echo 2. Copy the repository URL
echo 3. Run: git remote add origin YOUR_REPO_URL
echo 4. Run: git push -u origin main
echo.
echo ========================================
pause
