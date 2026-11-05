# ============================================================================
# EstateIQ Local Database Management Utility
# ============================================================================

param (
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "init", "seed", "verify", "psql")]
    [string]$Action = "status"
)

$PG_APP = "C:\Users\moksh\pgsql\app"
$PG_BIN = "$PG_APP\bin"
$PG_DATA = "C:\Users\moksh\pgsql\data"
$PG_LOG = "C:\Users\moksh\pgsql\logs\postgres.log"
$PID_FILE = "$PG_DATA\postmaster.pid"
$ROOT_DIR = (Resolve-Path "$PSScriptRoot\..").Path
$ENV_FILE = "$ROOT_DIR\backend\.env"

# Load DB credentials from backend\.env
$DB_USER = "estateiq_user"
$DB_NAME = "estateiq"
$DB_PORT = "5432"
$DB_HOST = "localhost"
$DB_PASS = ""

if (Test-Path $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match "^\s*DB_USER\s*=\s*(.+)$") { $DB_USER = $matches[1].Trim() }
        if ($_ -match "^\s*DB_NAME\s*=\s*(.+)$") { $DB_NAME = $matches[1].Trim() }
        if ($_ -match "^\s*DB_PORT\s*=\s*(.+)$") { $DB_PORT = $matches[1].Trim() }
        if ($_ -match "^\s*DB_HOST\s*=\s*(.+)$") { $DB_HOST = $matches[1].Trim() }
        if ($_ -match "^\s*DB_PASSWORD\s*=\s*(.+)$") { $DB_PASS = $matches[1].Trim() }
    }
}

function Check-Port {
    param([int]$Port = 5432)
    $tcp = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $tcp.TcpTestSucceeded
}

switch ($Action) {
    "status" {
        $isRunning = Check-Port $DB_PORT
        if ($isRunning) {
            Write-Host "`n[OK] PostgreSQL is RUNNING on port $DB_PORT." -ForegroundColor Green
            $env:PGPASSWORD = $DB_PASS
            & "$PG_BIN\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT current_database() as database, current_user as user, version();" 2>$null
            $env:PGPASSWORD = $null
        } else {
            Write-Host "`n[STOPPED] PostgreSQL is NOT running on port $DB_PORT." -ForegroundColor Yellow
            Write-Host "Run `".\scripts\db.ps1 start`" to launch the database." -ForegroundColor Gray
        }
    }

    "start" {
        if (Check-Port $DB_PORT) {
            Write-Host "[INFO] PostgreSQL is already active on port $DB_PORT." -ForegroundColor Cyan
            return
        }

        # Check for stale postmaster.pid
        if (Test-Path $PID_FILE) {
            $existingPid = (Get-Content $PID_FILE -TotalCount 1).Trim()
            $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
            if (-not $proc) {
                Write-Host "[CLEANUP] Removing stale lock file ($PID_FILE)..." -ForegroundColor Gray
                Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
            }
        }

        Write-Host "[STARTING] Launching PostgreSQL 17 on $DB_HOST`:$DB_PORT..." -ForegroundColor Cyan
        Start-Process -FilePath "$PG_BIN\postgres.exe" -ArgumentList "-D `"$PG_DATA`"" -WindowStyle Hidden
        
        $attempts = 0
        while ($attempts -lt 10) {
            Start-Sleep -Milliseconds 800
            if (Check-Port $DB_PORT) {
                Write-Host "[SUCCESS] PostgreSQL started successfully on port $DB_PORT." -ForegroundColor Green
                return
            }
            $attempts++
        }
        Write-Host "[ERROR] PostgreSQL did not respond in time. Check $PG_LOG" -ForegroundColor Red
    }

    "stop" {
        Write-Host "[STOPPING] Gracefully shutting down PostgreSQL..." -ForegroundColor Cyan
        & "$PG_BIN\pg_ctl.exe" -D $PG_DATA stop -m fast
        Start-Sleep -Seconds 1
        if (-not (Check-Port $DB_PORT)) {
            Write-Host "[SUCCESS] PostgreSQL stopped." -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Process may still be closing." -ForegroundColor Yellow
        }
    }

    "restart" {
        & "$PSScriptRoot\db.ps1" stop
        Start-Sleep -Seconds 1
        & "$PSScriptRoot\db.ps1" start
    }

    "init" {
        Write-Host "[INIT] Executing schema.sql on $DB_NAME..." -ForegroundColor Cyan
        $env:PGPASSWORD = $DB_PASS
        & "$PG_BIN\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$ROOT_DIR\database\schema.sql"
        $env:PGPASSWORD = $null
        Write-Host "[SUCCESS] Schema applied." -ForegroundColor Green
    }

    "seed" {
        Write-Host "[SEED] Populating $DB_NAME with seed data..." -ForegroundColor Cyan
        $env:PGPASSWORD = $DB_PASS
        & "$PG_BIN\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$ROOT_DIR\database\seed.sql"
        $env:PGPASSWORD = $null
        Write-Host "[SUCCESS] Seed data applied." -ForegroundColor Green
    }

    "verify" {
        Write-Host "`n[VERIFY] Table counts in database '$DB_NAME':" -ForegroundColor Cyan
        $env:PGPASSWORD = $DB_PASS
        $query = @"
        SELECT 
            table_name, 
            (xpath('/row/cnt/text()', xml_count))[1]::text::int as records
        FROM (
            SELECT table_name, 
                   query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ) t
        ORDER BY table_name;
"@
        & "$PG_BIN\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $query
        $env:PGPASSWORD = $null
    }

    "psql" {
        $env:PGPASSWORD = $DB_PASS
        & "$PG_BIN\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
        $env:PGPASSWORD = $null
    }
}
