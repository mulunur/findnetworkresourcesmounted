import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import { promisify } from "util";
import { createInterface } from "readline";
import path = require("path");
import * as xml2js from "xml2js";

let netEnum: any;
let netEnumCb: any;
let netEnumScope: any;
let netEnumType: any;
let netEnumUsage: any;
let netEnumDisplayType: any;

interface NetworkResourceMounted {
    path: string;       // Сетевой путь в формете URL
    mountpoint: string; // Точка монтирования - буква диска для Win, для Linux - папка, куда смонтировано, или ничего
    fstype: string;     // Файловая система
    sid?: string;       // Владеющий пользователь (только для win)
    uid?: string;       // Пользователь (только для linux)
    source: string;     // Источник получения данных ( 'netuse' | 'registry' | 'win-shortcuts' | 'mountinfo' | 'gtk-shortcut' | 'flyfm-shortcut' | ... )
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
    smb = "smb",
    smbfs = "smbfs",
    smbnetfs = "smbnetfs",
    sshfs = "sshfs",
    ftp = "ftp"
}

const getPlatformSpecificNetworkResourcesMounts = async (): Promise<NetworkResourceMounted[]> => {
    const platform: NodeJS.Platform = os.platform();

    try {
        if (platform === Platform.Linux) {
            return getLinuxNetworkMounts();
        } else  {
            ({ netEnum: netEnumCb, netEnumScope, netEnumType, netEnumUsage, netEnumDisplayType } = require('./winnetwork.node'));
            netEnum = promisify(netEnumCb);
            return Promise.resolve(getWindowsNetworkMounts());
        }
    } catch (e) {
        console.log(e)
        return Promise.reject(e)
    }
}

/**************
*    LINUX    *
***************/

enum FstabColumnNamesPosition {
    path = 0,
    mountpoint = 1,
    fstype = 8,
    options = 9,
};

async function parseFstab(path = "/etc/fstab"): Promise<NetworkResourceMounted[]> {
    const entries: NetworkResourceMounted[] = [];
    const fileStream = fs.createReadStream(path);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let logicalLine = "";

    for await (const origLine of rl) {
        let line = origLine.trim();

        if (!line || line.startsWith("#")) continue;
        if (line.endsWith("\\")) {
            logicalLine += line.slice(0, -1) + " ";
            continue;
        } else {
            logicalLine += line;
        }
        // удаляет общий случай inline comments
        const commentIndex = logicalLine.indexOf("#");
        if (commentIndex !== -1) logicalLine = logicalLine.slice(0, commentIndex).trim();

        if (logicalLine) {
            const fields = logicalLine.split(/\s+/);
            if (fields.length >= 6 && isNetworkFs(fields[2])) {
                entries.push({
                    path: fields[FstabColumnNamesPosition.path],
                    mountpoint: fields[FstabColumnNamesPosition.mountpoint],
                    fstype: fields[FstabColumnNamesPosition.fstype],
                    uid: "", // fstab  не содержит информации о пользователе
                    source: "fstab",
                });
            }
        }
        logicalLine = "";
    }
    return entries;
}

enum MountInfoColumnNamesPosition {
    path = 5,
    mountpoint = 4,
    fstype = 9,
    options = 9,
};

async function parseMountInfo(path = "/proc/self/mountinfo"): Promise<NetworkResourceMounted[]> {
    const entries: NetworkResourceMounted[] = [];
    const fileStream = fs.createReadStream(path);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        // порядок полей см. https://man7.org/linux/man-pages/man5/proc_pid_mountinfo.5.html
        const parts = line.trim().split(/\s+/);
        // В Mountinfo всегда встречается "-", разделяющий поля на две группы, fstype следует за ним
        //const dashIdx = parts.indexOf("-");
        //if (dashIdx === -1 || dashIdx + 3 > parts.length) continue;
        const fstype = parts[MountInfoColumnNamesPosition.fstype]; //[dashIdx + 1];
        const path = parts[MountInfoColumnNamesPosition.path] //[dashIdx + 2];
        const mountpoint = parts[MountInfoColumnNamesPosition.mountpoint];
        const source = 'mountinfo';
        if (isNetworkFs(fstype)) {
            entries.push({
                path: path,
                mountpoint,
                fstype,
                uid: "", // Не содержится в mountinfo
                source,
            });
        }
    }
    return entries;
}
export async function getAllSystemNetworkMounts(): Promise<NetworkResourceMounted[]> {
    const procDir = "/proc";
    const namespaceSeen = new Set<string>(); // ключ: inode namespace, значение: уже обработан
    const allMounts: { key: string, item: NetworkResourceMounted }[] = [];

    let dirEntries: fs.Dirent[];
    try {
        dirEntries = await fs.promises.readdir(procDir, { withFileTypes: true });
    } catch {
        return [];
    }

    for (const dirEntry of dirEntries) {
        if (!dirEntry.isDirectory() || !/^\d+$/.test(dirEntry.name)) continue;
        const pid = dirEntry.name;

        // Путь для mount namespace
        const namespacePath = path.join(procDir, pid, "ns", "mnt");
        let namespaceInode: string;
        try {
            namespaceInode = await fs.promises.readlink(namespacePath); // например, 'mnt:[4026531840]' -  только inode недостаточно, нужен и device id
            const stat = fs.statSync(`${procDir}/${pid}/ns/mnt`);
            const nsId = `${stat.dev}:${stat.ino}`;
            if (namespaceSeen.has(nsId)) continue; // такой namespace уже обработан
            namespaceSeen.add(nsId);
        } catch {
            continue; // нет доступа или процесс завершился
        }


        // Читаем mountinfo для этого процесса
        const mountinfoPath = path.join(procDir, pid, "mountinfo");
        let fileStream: fs.ReadStream;
        try {
            fileStream = fs.createReadStream(mountinfoPath);
        } catch {
            continue;
        }
        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            const parts = line.trim().split(/\s+/);
            const dashIdx = parts.indexOf("-");
            if (dashIdx === -1 || dashIdx + 3 > parts.length) continue;
            const fstype = parts[dashIdx + 1];
            const path = parts[dashIdx + 2];
            const mountpoint = parts[4];
            const source = 'mountinfo';
            if (isNetworkFs(fstype)) {
                // Уникальность по (path, mountpoint, fstype)
                const key = `${source}|${mountpoint}|${fstype}`;
                allMounts.push({ key, item: { path: path, mountpoint, fstype, uid: "", source } });
            }
        }
    }

    // Оставляем только уникальные по ключу
    const uniqMap = new Map<string, NetworkResourceMounted>();
    for (const { key, item } of allMounts) {
        if (!uniqMap.has(key)) uniqMap.set(key, item);
    }

    return Array.from(uniqMap.values());
}

// Поиск сетевых закладок текущего пользователя в различных дистрибутивах Linux.
export async function getLinuxNetworkBookmarks(): Promise<NetworkResourceMounted[]> {
    // добавить всех пользователей для root 
    const home = os.homedir();

    // Пути к возможным файлам закладок
    const candidates = [
        // среда GNOME (и Alt, Red OS, АльтерОС)
        path.join(home, ".config", "gtk-3.0", "bookmarks"),
        // Astra Linux
        path.join(home, ".config", "rusbitech", "fly-fm-vfs.conf"),
        // XBEL bookmarks (Astra или другие дистрибы)
        path.join(home, ".local", "share", "user-places.xbel"),
    ];

    const results: NetworkResourceMounted[] = [];
    for (const file of candidates) {
        try {
            const stat = await fs.promises.stat(file);
            if (!stat.isFile()) continue;

            if (file.endsWith("user-places.xbel")) {
                results.push(...(await parseXbelBookmarks(file)));
            } else if(file.endsWith("fly-fm-vfs.conf")) {
                results.push(...(await parseAstraBookmarks(file)));
            }
            else {
                results.push(...(await parseSimpleBookmarks(file)));
            }
        } catch (e) {
            // ignore
        }
    }
    // Оставляем только сетевые
    return results.filter(result => isNetworkFs(result.path));
}

// Парсинг закладок Astra
async function parseAstraBookmarks(file: string): Promise<NetworkResourceMounted[]> {
    const content = await fs.promises.readFile(file, "utf8");
    const lines = content.split("\n").map(line => line.trim()).filter(Boolean);
    const bookmarks: NetworkResourceMounted[] = [];
    let currentEntry: { name?: string; url?: string } = {};

    for (const line of lines) {
        if (line.startsWith("#") || !line) continue;

        if (line.startsWith("[")) {
            if (currentEntry.url) {
                bookmarks.push({
                    path: currentEntry.url,
                    mountpoint: currentEntry.name || "",
                    fstype: "",
                    uid: "Текущий пользователь",
                    source: "fly-fm-vfs.conf",
                });
            }
            currentEntry = {}; // начинаем новую запись
        } else if (line.startsWith("Name=")) {
            currentEntry.name = line.slice("Name=".length).trim();
        } else if (line.startsWith("Url=")) {
            currentEntry.url = line.slice("Url=".length).trim();  // АльтерОС: "smb:///example example", где example может быть названием директории
        }
    }

    if (currentEntry.url) {
        bookmarks.push({
            path: currentEntry.url,
            mountpoint: currentEntry.name || "",
            fstype: "",
            uid: "Текущий пользователь", // взять uid из home директории ?
            source: "Содержится в закладках проводника",
        });
    }

    return bookmarks;
}

// Парсинг закладок (GNOME, АльтерОС, RedOS, Alt Linux)
async function parseSimpleBookmarks(file: string): Promise<NetworkResourceMounted[]> {
    const content = await fs.promises.readFile(file, "utf8");
    const lines = content.split("\n").map(line => line.trim()).filter(Boolean);
    const bookmarks: NetworkResourceMounted[] = [];

    for (const line of lines) {
        if (line.startsWith("#") || !line) continue;
        bookmarks.push({
            path: line,
            mountpoint: line.split("/").filter(Boolean).pop() || "",
            fstype: "",
            uid: "Текущий пользователь",
            source: "Содержится в закладках проводника",
        });
    }

    return bookmarks;
}

// Парсинг XBEL-файла user-places.xbel (Astra Linux)
async function parseXbelBookmarks(file: string): Promise<NetworkResourceMounted[]> {
    const content = await fs.promises.readFile(file, "utf8");
    const bookmarks: NetworkResourceMounted[] = [];
    const parsed = await xml2js.parseStringPromise(content, { explicitArray: false });

    if (parsed.xbel && parsed.xbel.bookmark) {
        const bms = Array.isArray(parsed.xbel.bookmark) ? parsed.xbel.bookmark : [parsed.xbel.bookmark];
        for (const bm of bms) {
            const uri = bm["$"]?.href;
            let label = undefined;
            if (bm.title) label = typeof bm.title === "string" ? bm.title : bm.title._;
            if (uri) bookmarks.push({
                path: uri,
                mountpoint: label || "",
                fstype: "",
                uid: "Текущий пользователь",
                source: "Содержится в закладках проводника",
            });
        }
    }
    return bookmarks;
}

/**
 * Аггрегирует сетевые расположения по /proc/<pid>/mountinfo, /etc/fstab, закладкам файлового менеджера
 */
export const getLinuxNetworkMounts = async (): Promise<NetworkResourceMounted[]> => {
    let results: NetworkResourceMounted[] = [];

    try {
        const mounts = await parseMountInfo();
        if (mounts.length) results.push(...mounts);
    } catch (e) {
        // ignore
    }

    try {
        const fstab = await parseFstab();
        if (fstab.length) results.push(...fstab);
    } catch (e) {
        console.log(e)
        // ignore
    }

    try {
        const mountsByProcesses = await getAllSystemNetworkMounts();
        if (mountsByProcesses.length) results.push(...mountsByProcesses);
    } catch (e) {
        console.log(e)
        // ignore
    }

    try {
        const mountsByBoookMarks = await getLinuxNetworkBookmarks();
        if (mountsByBoookMarks.length) results.push(...mountsByBoookMarks);
    } catch (e) {
        console.log(e)
        // ignore
    }
    return results;
};

/**************
*   WINDOWS   *
***************/

// Найти network shortcuts для всех пользоватетелй
const getNetworkShortcutMounts = async (): Promise<NetworkResourceMounted[]> => {
    const mounts: NetworkResourceMounted[] = [];

    // путь к appdata для текущего пользователя можно найти здесь: HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders/AppData

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

    $networkShortcutsPath = Join-Path $appDataPath 'Roaming\\Microsoft\\Windows\\Network Shortcuts'
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
                uid: parsed.sid,
                source: "win-shortcuts"
            });
        } catch (err) {
            // ignore
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
                        path = $values.RemotePath
                        fstype = $values.ProviderName
                        source = "registry"
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
                // ignore. Ошибка может возникать при запуске без прав администрирования
            }
        }

        resolve(mounts);
    })
}

const getNetUseMounts = async (): Promise<NetworkResourceMounted[]> => {
    try {
        const netUseSharesConnected = (await netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)).map(humanize);
        const netUseSharesRemembered = (await netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)).map(humanize);
        return ([...netUseSharesConnected.map(mapToNetworkResource), ...netUseSharesRemembered.map(mapToNetworkResource)]);
    } catch (e) {
        // ignore
        return [];
    }
}

const getWindowsNetworkMounts = async (): Promise<NetworkResourceMounted[]> => {
    const networkShortcuts = await getNetworkShortcutMounts();
    const netUseMounts = await getNetUseMounts();
    const registryNetworkMounts = await getNetworkRegistryMounts();
    const result = deduplicateByMerging([...networkShortcuts, ...netUseMounts, ...registryNetworkMounts]);
    return result;
}

// Вспомогательные функции 
function isNetworkFs(fstype?: string): fstype is NetworkFSNames {
    const FsNames = Object.values(NetworkFSNames);
    // может быть стоит привести fstype к lowcase
    return !!fstype && (FsNames.includes(fstype as NetworkFSNames) || FsNames.some(fs => fstype.includes(fs)));
}

function mergeObjects(a: NetworkResourceMounted, b: NetworkResourceMounted): NetworkResourceMounted {
    return {
        path: a.path || b.path,
        mountpoint: a.mountpoint || b.mountpoint,
        fstype: a.fstype || b.fstype,
        uid: a.uid || b.uid,
        sid: a.sid || b.sid,
        source: a.source || b.source,
    };
}

function deduplicateByMerging(input: NetworkResourceMounted[]): NetworkResourceMounted[] {
    const map = new Map<string, NetworkResourceMounted>();

    for (const item of input) {
        const key = `${item.path}|${item.uid}|${item.sid}`;
        if (!map.has(key)) {
            map.set(key, item);
        } else {
            const merged = mergeObjects(map.get(key)!, item);
            map.set(key, merged);
        }
    }

    return Array.from(map.values());
}

function keyOf(rec: any, val: any) {
    const idx = Object.values(rec).indexOf(val);
    if (idx < 0) return undefined;
    return Object.keys(rec)[idx];
}

function humanize(res: any) {
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
    return {
        path: rec.remoteName,
        mountpoint: rec.localName,
        fstype: rec.displayType,
        uid: rec.uid,
        sid: rec.sid,
        source: "net use"
    }
}

// Вывод программы

getPlatformSpecificNetworkResourcesMounts()
    .then(mounts => {
        console.log(mounts);
    })
    .catch(err => {
        console.error("Ошибка:", err);
    });