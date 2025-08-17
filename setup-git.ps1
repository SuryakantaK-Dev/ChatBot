Write-Host "========================================" -ForegroundColor Green
Write-Host "    ChatBot Git Setup Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Installing Git via Chocolatey..." -ForegroundColor Yellow
choco install git -y --force

Write-Host ""
Write-Host "Step 2: Refreshing environment..." -ForegroundColor Yellow
Import-Module $env:ChocolateyInstall\helpers\chocolateyProfile.psm1
refreshenv

Write-Host ""
Write-Host "Step 3: Checking Git installation..." -ForegroundColor Yellow
try {
    git --version
    Write-Host "Git installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Git installation failed. Please install manually." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Setting up Git repository..." -ForegroundColor Yellow
git init
git add .
git commit -m "Initial commit: AI Chatbot with Document Preview"

Write-Host ""
Write-Host "Step 5: Repository setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
Write-Host "2. Copy the repository URL" -ForegroundColor White
Write-Host "3. Run: git remote add origin YOUR_REPO_URL" -ForegroundColor White
Write-Host "4. Run: git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green

Read-Host "Press Enter to continue"
