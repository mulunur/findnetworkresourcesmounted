import { execFile, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as util from "util";
import { promisify } from "util";
import { createInterface } from "readline";
import { rejects } from "assert";
const { netEnum: netEnumCb, netEnumScope, netEnumType, netEnumUsage, netEnumDisplayType } = require('./winnetwork.node')

const netEnum = promisify(netEnumCb);

interface NetworkResourceMounted {
    path: string;       // Сетевой путь
    mountpoint: string; // Точка монтирования
    fstype: string;     // Файловая система
    userSid: string;    // Владеющий пользователь
    options: string;    // Другие характеристики сетевого ресурса
}

enum Platform {
    Linux = "linux",
    Win32 = "win32",
}

enum NetworkFSNames {
    undefined = "",
    prlfs = "prl_fs",
    nfs = "nfs",
    cifs = "cifs",
    smbfs = "smbfs",
    sshfs = "sshfs",
}

const getPlatformSpecificNetworkResourcesMounts = async (): Promise<NetworkResourceMounted[]> => {
    const platform: NodeJS.Platform = os.platform();

    try {
        if (platform === Platform.Linux) {
            return getLinuxNetworkMounts();
        } else if (platform === Platform.Win32) {
            return Promise.resolve(getWindowsNetworkMounts());
        }
        else {
            return Promise.reject(`ОС ${platform} не поддерживается.`);
        }
    } catch(e) {
        console.log(e)
        return Promise.reject(e)
    }
}

const getLinuxNetworkMounts = async (): Promise<NetworkResourceMounted[]> => {
    // /proc/self - папка текущего процесса (symlink), может быть придется просмотреть все процессы в /proc
    const pathsToMountInfo = ["/proc/self/mountinfo", "/etc/fstab"]; //fstab может быть отредактирован администратором (могут встречаться спонтанные строки), 
    // /proc/mounts
    // посмотреть комменатрии, line continuation 

    enum FstabColumnNamesPosition {
        path = 2,
        mountpoint = 4,
        fstype = 8,
        options = 9,
    };
    enum MtabColumnNamesPosition {
        path = 4,
        mountpoint = 3,
        fstype = 8,
        options = 9,
    };
    return new Promise(async (resolve, reject) => {
        for (const path of pathsToMountInfo) {
            try {
                const data = await fs.promises.readFile(path, "utf8"); //readline для построчного чтения. параметр clrf delay
                const mounts: NetworkResourceMounted[] = data
                    .split("\n")
                    .map(line => line.split(/\s+/))
                    .filter(parts =>
                        Object.values(NetworkFSNames).includes(parts[MtabColumnNamesPosition.fstype] as NetworkFSNames))
                    .map(parts => ({
                        path: parts[MtabColumnNamesPosition.path],
                        mountpoint: parts[MtabColumnNamesPosition.mountpoint],
                        fstype: parts[MtabColumnNamesPosition.fstype],
                        userSid: "",
                        options: parts.slice(9).join(" "),
                    }));
                resolve(mounts);
                break;
            } catch (err) {
            }
        }
        reject();
    });
}

const getNetworkShortcutMounts = async (): Promise<NetworkResourceMounted[]> => {
    const mounts: NetworkResourceMounted[] = [];
    const execFileAsync = util.promisify(execFile);

    // получить  appdata для всех пользоватетелй
    // расположение appdata для текущего пользователя HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders/AppData
    // $userKeys = Get-ChildItem -Path Registry::HKEY_USERS\ 

const psScriptAllUsersDynamic = `
$shell = New-Object -ComObject Shell.Application

# все SID из HKEY_USERS, без классов
$loadedSIDs = Get-ChildItem Registry::HKEY_USERS | Where-Object {
    $_.Name -notmatch '_Classes$'
}

foreach ($sidKey in $loadedSIDs) {
    $sid = $sidKey.PSChildName
    $appDataPath = (Get-ItemProperty -Path ("Registry::HKEY_USERS\\$sid\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders")).AppData
    Write-Output ("AppDataPath for $sid $appDataPath")
    if (-not $appDataPath) { continue }

    $networkShortcutsPath = Join-Path $appDataPath 'Microsoft\\Windows\\Network Shortcuts'
    if (-not (Test-Path $networkShortcutsPath)) { 
        Write-Output "Not found: $networkShortcutsPath"
        continue 
    }

    $folder = $shell.NameSpace($networkShortcutsPath)
    if ($null -eq $folder) { 
    Write-Output "Folder COM object null for $networkShortcutsPath"
    continue }

    foreach ($item in $folder.Items()) {
        if ($item.IsLink) {
            $target = $item.GetLink().Path
            $obj = @{
                name = $item.Name
                path = $target
                sid = $sid
            }
            $json = $obj | ConvertTo-Json -Compress -Depth 2
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
            Write-Host $b64
        }
    }
}
`

    /*
    try {
        const { stdout } = await execFileAsync("powershell", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command", psScript
        ]);
        const lines = stdout.trim().split(/\r?\n/);
        for (const line of lines) {
            const match = /^\[(.+?)\] => (.+)$/.exec(line); 
            if (match) {
                const [, name, target] = match;
                mounts.push({
                    path: target,
                    mountpoint: "",
                    fstype: "",
                    options: "Network Folder"
                });
            }
        }
    } catch (e) {
    }

    return mounts;
    */

    const psProcess = spawn('powershell.exe', [
        '-ExecutionPolicy', 'ByPass',
        '-NoLogo',
        '-NoProfile',
        '-Command', psScriptAllUsersDynamic
    ], { stdio: ['ignore', 'pipe', 'inherit'] });

    const iface = createInterface({
        input: psProcess.stdout,
        crlfDelay: Infinity
    });

    for await (const line of iface) {
        try {
            const json = Buffer.from(line.trim(), 'base64').toString('utf8');
            const parsed = JSON.parse(json);
            mounts.push({
                path: parsed.path,
                mountpoint: parsed.name,
                fstype: "",
                userSid: parsed.sid,
                options: "Network Folder"
            });
        } catch (err) {
            console.error("Ошибка декодирования строки:", line);
        }
    }

    return Promise.resolve(mounts);
}

const getNetworkRegistryMounts = async (): Promise<NetworkResourceMounted[]> => {
    return new Promise(async (resolve, reject) => {
        const mounts: NetworkResourceMounted[] = [];

    const script = `
    function WriteBase64($s) { 
        Write-Host ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s)))
    }

    $userKeys = Get-ChildItem -Path Registry::HKEY_USERS\

    foreach ($key in $userKeys) { 
        
        $sid = $key.PSChildName

        $networkKeyPath = "Registry::HKEY_USERS\\$sid\\Network"

        if (Test-Path $networkKeyPath) {
            try {
                $networkKey = Get-ChildItem -Path $networkKeyPath
                } catch { Write-Error $_}

            foreach ($netKey in $networkKey) {
            
                $values = Get-ItemProperty -Path $netKey.PSPath

                $obj = @{
                        userSid = $sid
                        mountpoint = $netKey.PSChildName
                        remotePath = $values.RemotePath
                        providerName = $values.ProviderName
                    }
                $json = $obj | ConvertTo-Json -Compress
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $base64 = [System.Convert]::ToBase64String($bytes)
                Write-Host $base64
            }
        }
    }`

    const ps = spawn("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", script
    ], { stdio: ['ignore', 'pipe', 'inherit'] });

    const rl = createInterface({ input: ps.stdout, crlfDelay: Infinity });

    for await (const line of rl) {
        try {
            const decoded = Buffer.from(line, 'base64').toString('utf8');
            const obj = JSON.parse(decoded);
            mounts.push(obj);
        } catch (err) {
            console.error("Ошибка декодирования строки:", line);
        }
    }

    resolve(mounts);
    })
}

const getNetUseMounts = async (): Promise<NetworkResourceMounted[]> => {
        try {
            const netUseSharesConnected = (await netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)).map(humanize); 
            const netUseSharesRemembered = (await netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)).map(humanize); 
            return([...netUseSharesConnected.map(mapToNetworkResource), ...);
        } catch (e) {
            console.log("Ошибка использования native модуля для net use", e)
            return [];
        }
}

const getWindowsNetworkMounts = async (): Promise<NetworkResourceMounted[]> => {
    const networkShortcuts = await getNetworkShortcutMounts();
    const networkMounts = await getNetUseMounts();
    const registryNetworkMounts = await getNetworkRegistryMounts();
    return [...networkShortcuts, ...networkMounts, ...registryNetworkMounts];
}

// Вспомогательные функции 

function keyOf(rec: any, val: any) {
    const idx = Object.values(rec).indexOf(val);
    if (idx < 0) return undefined;
    return Object.keys(rec)[idx];
}

function humanize(res: any) {
    console.log("mapNetUseNative humanize res", res)
    return {
        scope: keyOf(netEnumScope, res.scope),
        type: keyOf(netEnumType, res.type),
        usage: keyOf(netEnumUsage, res.usage),
        displayType: keyOf(netEnumDisplayType, res.displayType),
        localName: res.localName,
        remoteName: res.remoteName,
        comment: res.comment,
    }
}

function mapToNetworkResource(rec: any): NetworkResourceMounted {
    console.log("mapNetUseNative")
    return {
        path: rec.remoteName,
        mountpoint: rec.localName,
        fstype: rec.displayType,
        userSid: rec.sid,
        options: rec.commnet
    }
}

// Выполняемая функция

getPlatformSpecificNetworkResourcesMounts()
    .then(mounts => {
        console.log(mounts);
    })
    .catch(err => {
        console.error("Ошибка:", err);
    });