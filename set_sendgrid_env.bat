@echo off
REM Set SendGrid environment variables
set SENDGRID_API_KEY=SG.r_xxxxxxxxxxxxxxxxxxxxx
set SENDGRID_FROM_EMAIL=dennis800121@gmail.com
set SENDGRID_FROM_NAME=WestBudget
set RESET_PASSWORD_URL=http://localhost:5100

echo Miljövariabler för SendGrid är nu satta:
echo SENDGRID_FROM_EMAIL=%SENDGRID_FROM_EMAIL%
echo SENDGRID_FROM_NAME=%SENDGRID_FROM_NAME%
echo.
echo Starta backend-servern med: python app.py
echo.

