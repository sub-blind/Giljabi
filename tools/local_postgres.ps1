param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'start'
)

# 현재 PC에 초기화한 프로젝트 전용 PostgreSQL 인스턴스를 관리한다.
$storyroutePgCtl = 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe'
$storyroutePgData = Join-Path $env:LOCALAPPDATA 'StoryRoute\Tourism\postgres17'
if (-not (Test-Path -LiteralPath $storyroutePgCtl) -or
    -not (Test-Path -LiteralPath (Join-Path $storyroutePgData 'PG_VERSION'))) {
    throw '이 PC에 초기화한 로컬 PostgreSQL이 없습니다. PostgreSQL 도입 문서의 Docker 실행 방법을 사용해주세요.'
}

switch ($Action) {
    'start' {
        & $storyroutePgCtl -D $storyroutePgData status *> $null
        if ($LASTEXITCODE -eq 0) { Write-Output 'StoryRoute 로컬 PostgreSQL이 실행 중입니다.'; exit 0 }
        $storyroutePgStart = Start-Process -FilePath $storyroutePgCtl -WindowStyle Hidden -PassThru `
            -ArgumentList @('-D', ('"' + $storyroutePgData + '"'), '-l', ('"' + (Join-Path $storyroutePgData 'server.log') + '"'), '-o', '"-h 127.0.0.1 -p 55432"', '-w', '-t', '30', 'start') `
            -RedirectStandardOutput (Join-Path $storyroutePgData 'pgctl-start.out.log') `
            -RedirectStandardError (Join-Path $storyroutePgData 'pgctl-start.err.log')
        $storyroutePgStart.WaitForExit()
        $storyroutePgStart.Refresh()
        exit $storyroutePgStart.ExitCode
    }
    'stop' { & $storyroutePgCtl -D $storyroutePgData -m fast -w stop }
    'status' { & $storyroutePgCtl -D $storyroutePgData status }
}
exit $LASTEXITCODE
