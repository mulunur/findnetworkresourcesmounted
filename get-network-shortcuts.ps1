$networkShortcuts = "$env:APPDATA\Microsoft\Windows\Network Shortcuts"

if (-Not (Test-Path $networkShortcuts)) {
    exit
}

$shell = New-Object -ComObject Shell.Application
$folder = $shell.NameSpace($networkShortcuts)

if ($null -eq $folder) {
    exit
}

foreach ($item in $folder.Items()) {
    if ($item.IsLink) {
        $target = $item.GetLink().Path
        Write-Output "[$($item.Name)] => $target"
    }
}

