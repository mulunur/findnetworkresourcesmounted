$networkShortcuts = "$env:APPDATA\Microsoft\Windows\Network Shortcuts"

if (-Not (Test-Path $networkShortcuts)) {
    Write-Error "Папка не найдена: $networkShortcuts"
    exit
}

$shell = New-Object -ComObject Shell.Application
$folder = $shell.NameSpace($networkShortcuts)

if ($null -eq $folder) {
    Write-Error "Не удалось открыть папку: $networkShortcuts"
    exit
}

foreach ($item in $folder.Items()) {
    if ($item.IsLink) {
        $target = $item.GetLink().Path
        Write-Output "[$($item.Name)] => $target"
    } else {
        Write-Output "[$($item.Name)] => Не ссылка"
    }
}

