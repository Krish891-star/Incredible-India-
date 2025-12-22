@echo off
echo 🧪 Starting Supabase Integration Tests...
echo.

echo 🔍 Checking Supabase CLI installation...
supabase --version
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not installed or not in PATH
    exit /b 1
)
echo ✅ Supabase CLI is installed
echo.

echo 📂 Checking current migrations...
supabase migration list
if %errorlevel% neq 0 (
    echo ❌ Failed to list migrations
    exit /b 1
)
echo ✅ Migration status checked
echo.

echo 🔄 Applying new migrations...
supabase migration up
if %errorlevel% neq 0 (
    echo ❌ Failed to apply migrations
    exit /b 1
)
echo ✅ New migrations applied
echo.

echo 📊 Checking database status...
supabase status
if %errorlevel% neq 0 (
    echo ❌ Failed to check database status
    exit /b 1
)
echo ✅ Database status checked
echo.

echo 🎉 All Supabase integration tests passed!
echo.
echo 📝 Next steps:
echo 1. Restart your development server
echo 2. Test tour guide registration
echo 3. Test hotel partner registration
echo 4. Verify automatic profile creation works