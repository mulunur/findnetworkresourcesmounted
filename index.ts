import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import { promisify } from "util";
import { createInterface } from "readline";
import path = require("path");
import * as xml2js from "xml2js";
import parse, { ParserOptions } from "ini-config-parser";  // Сейчас код использует этот парсер INI-файлов.
import minimist from "minimist";


async function main() {
    getPlatformSpecificNetworkResourcesMounts()
        .then(mounts => {
            console.log(mounts);
        })
        .catch(err => {
            console.error("Ошибка:", err);
        });
}

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
    name?: string;      // Название
    source: string;     // Источник получения данных ( 'netuse' | 'registry' | 'win-shortcuts' | 'mountinfo' | 'gtk-shortcut' | 'flyfm-shortcut' | ... )
}

enum Sources {
    netuse = "netuse",
    registry = "registry",
    winshortcuts = "win-shortcuts",
    mountinfo = "mountinfo",
    fstab = "fstab",
    gtkShortcut = "gtk-shortcut",
    flyFmShortcut = "flyfm-shortcut",
    xbelShortcut = "user-places.xbel"
}

enum NetworkFSNames {
    prlfs = "prl_fs",
    nfs = "nfs",
    cifs = "cifs",
    smb = "smb",
    smbfs = "smbfs",
    smbnetfs = "smbnetfs",
    sshfs = "sshfs",
    ftp = "ftp"
}

enum Platform {
    Linux = "linux",
    Win32 = "win32",
}

const getArgs = () => {
    var args = minimist(process.argv.slice(2), {
        string: ['sources'],
        unknown: function (arg: string) { console.log("Такой аргумент не существует"); return false } /* invoked on unknown param */
    })
    const source = args['sources'] as string;
    return source;
}

const getPlatformSpecificNetworkResourcesMounts = async (): Promise<NetworkResourceMounted[]> => {
    const platform: NodeJS.Platform = os.platform();
    const sources = getArgs();
    console.log("sources:", sources)

    try {
        if (platform === Platform.Linux) {
            return getLinuxNetworkMounts(sources);
        } else {
            ({ netEnum: netEnumCb, netEnumScope, netEnumType, netEnumUsage, netEnumDisplayType } = require('./winnetwork.node'));
            netEnum = promisify(netEnumCb);
            return getWindowsNetworkMounts(sources);
        }
    } catch (e) {
        console.log(e)
        return Promise.reject(e)
    }
}

/**************
*    LINUX    *
***************/

/**
* Порядок полей в файле fstab см. https://linux.die.net/man/5/fstab
* */
enum FstabColumnNamesPosition {
    path = 0,
    mountpoint = 1,
    fstype = 2,
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
                    uid: "", // fstab  не содержит информацию о пользователе
                    source: Sources.fstab,
                });
            }
        }
        logicalLine = "";
    }
    return entries;
}

/**
* Порядок полей в файле mountifo см. https://man7.org/linux/man-pages/man5/proc_pid_mountinfo.5.html
* */
enum MountInfoColumnNamesPosition {
    path = 4,
    mountpoint = 3,
    fstype = 8,
    name = 9,
};

async function parseMountInfo(path = "/proc/self/mountinfo"): Promise<NetworkResourceMounted[]> {
    const entries: NetworkResourceMounted[] = [];
    const fileStream = fs.createReadStream(path);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const parts = line.trim().split(/\s+/);
        const fstype = parts[MountInfoColumnNamesPosition.fstype];
        if (isNetworkFs(fstype)) {
            entries.push({
                path: parts[MountInfoColumnNamesPosition.path],
                mountpoint: parts[MountInfoColumnNamesPosition.mountpoint],
                fstype,
                uid: "", // mountinfo не содержит информацию о пользователе
                name: parts[MountInfoColumnNamesPosition.name],
                source: Sources.mountinfo,
            });
        }
    }
    return entries;
}

/**
 * Парсинг закладок Astra
 */
async function parseAstraBookmarks(homeDirectory: string): Promise<NetworkResourceMounted[]> {
    const sourceFile = path.join(homeDirectory, ".config", "rusbitech", "fly-fm-vfs.conf");
    const content = await fs.promises.readFile(sourceFile, "utf8");
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
                    source: sourceFile,
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
            source: Sources.flyFmShortcut,
        });
    }

    return bookmarks;
}

/**
 * Парсинг закладок (GNOME, АльтерОС, RedOS, Alt Linux)
 */
async function parseGtk3Bookmarks(file: string = ""): Promise<NetworkResourceMounted[]> {
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
            source: Sources.gtkShortcut,
        });
    }

    return bookmarks;
}

/**
 * Парсинг XBEL-файла user-places.xbel (Astra Linux)
 */
async function parseXbelBookmarks(sourceFile: string = "user-places.xbel"): Promise<NetworkResourceMounted[]> {
    const content = await fs.promises.readFile(sourceFile, "utf8");
    const bookmarks: NetworkResourceMounted[] = [];
    const parsed = await xml2js.parseStringPromise(content, { explicitArray: false });

    if (parsed.xbel && parsed.xbel.bookmark) {
        const bookmarks = Array.isArray(parsed.xbel.bookmark) ? parsed.xbel.bookmark : [parsed.xbel.bookmark];
        for (const bm of bookmarks) {
            const uri = bm["$"]?.href;
            let label = undefined;
            if (bm.title) label = typeof bm.title === "string" ? bm.title : bm.title._;
            if (uri) bookmarks.push({
                path: uri,
                mountpoint: label || "",
                fstype: "",
                uid: "Текущий пользователь",
                source: Sources.xbelShortcut,
            });
        }
    }
    return bookmarks;
}

/**
 * Агрегирует сетевые расположения по /proc/<pid>/mountinfo, /etc/fstab, закладкам файлового менеджера
 */
export const getLinuxNetworkMounts = async (sources: string): Promise<NetworkResourceMounted[]> => {
    let results: NetworkResourceMounted[] = [];

    switch (sources) {
        case Sources.mountinfo:
            try {
                results.push(...(await parseMountInfo()));
            } catch (e) {
                // ignore
            }
            break;
        case "fstab":
            try {
                results.push(...(await parseFstab()));
            } catch (e) {
                console.log(e)
                // ignore
            }
            break;
        case Sources.flyFmShortcut:
            try {
                let resultsLocal: NetworkResourceMounted[] = [];
                const users = await getPasswdUsers(true, await getMinNonSysUid());
                for (const user of users) {
                    const home = user.home;
                    const result = await parseAstraBookmarks(home)
                    result.map(x => x.uid = user.uid.toString())
                    resultsLocal.push(...result)
                }

                results.push(...resultsLocal);
            }
            catch (e) {
                console.log(e)
            }
            break;
        case Sources.xbelShortcut:
            try {
                results.push(... await perUserHomeDir(parseXbelBookmarks))
            } catch (e) {
                console.log(e)
            }
            break;
        case Sources.gtkShortcut:
            try {
                results.push(... await perUserHomeDir(parseGtk3Bookmarks))
            } catch (e) {
                console.log(e)
            }
            break;
        default:
            break;
    }

    return results;
};

const perUserHomeDir = async (parser: (home?: string) => Promise<NetworkResourceMounted[]>) => {
    let results = [];
    const users = await getPasswdUsers(true, await getMinNonSysUid());
    const domainUsers = await getUserProfileUids(await getMinNonSysUid());  // TODO: minNonSystemUserId - как его найти?
    for (const user of users) {
        const home = user.home;
        const uid = user.uid;
        const result = await parser(home)
        result.map(x => x.uid = uid.toString())
        results.push(...result)
    }
    return results;
}

const getMinNonSysUid = async () => {
    const configPath = '/etc/login.defs';
    try {
        const content = await fs.promises.readFile(configPath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('UID_MIN')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    const uid = parseInt(parts[1]);
                    if (!isNaN(uid)) return uid;
                }
            }
        }
        return null; // UID_MIN не найден
    } catch (e) {
        console.error(`Ошибка при чтении ${configPath}:`, e);
        return null;
    }
}

/**************
*   WINDOWS   *
***************/

/**
 * Найти network shortcuts для всех пользоватетелй
 */
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
}`

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
                source: Sources.winshortcuts
            });
        } catch (err) {
            // ignore
        }
    }

    return Promise.resolve(mounts);
}

/**
 * Найти сетевые расположения в реестре windows для всех пользоватетелй
 */
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
                const obj: NetworkResourceMounted = JSON.parse(decoded);
                mounts.push(obj);
            } catch (err) {
                // ignore. Ошибка может возникать при запуске без прав администрирования
            }
        }

        resolve(mounts);
    })
}

/**
 * Данные вывода команды net use
 */
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

const getWindowsNetworkMounts = async (sources: string): Promise<NetworkResourceMounted[]> => {
    let result: NetworkResourceMounted[] = [];

    switch (sources) {
        case Sources.netuse:
            try {
                result.push(...await getNetUseMounts());
            } catch (e) {
                console.log(e)
                // ignore
            }
            break;
        case Sources.registry:
            try {
                result.push(...await getNetworkRegistryMounts());
            } catch (e) {
                console.log(e)
                // ignore
            }
            break;
        case Sources.winshortcuts:
            try {
                result.push(...await getNetworkShortcutMounts());
            }
            catch (e) {
                console.log(e)
            }
            break;
        default:
            break;
    }

    result.map(res => res.path = convertUncToUrl(res.path, "smb"))
    return result;
}

// Вспомогательные функции 

function isNetworkFs(fstype: string): fstype is NetworkFSNames {
    const FsNames = Object.values(NetworkFSNames);
    fstype = fstype.toLowerCase()
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
        source: Sources.netuse
    }
}

function convertUncToUrl(uncPath: string, protocol: string = "smb"): string {
    // Убираем начальные обратные слеши (\\)
    const trimmed = uncPath.replace(/^\\\\+/, '');

    // Разделяем на части
    const parts = trimmed.split('\\').filter(Boolean);

    if (parts.length < 2) {
        throw new Error(`Неверный UNC путь: ${uncPath}`);
    }

    // Преобразуем в URL
    const host = parts[0];

    // TODO: функция encodeURIComponent образует некорректные символы для русских наименований smb://Mac/Home/Desktop/%D1%81%D0%B5%D1%82%D0%B5%D0%B2%D0%B0%D1%8F%20%D0%BF%D0%B0%D0%BF%D0%BA%D0%B0%202',
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
    // map(encodeURIComponent)
    const shareAndPath = parts.slice(1).join('/');

    return `${protocol}://${host}/${shareAndPath}`;
}

// =================== PASSWD (локальные учетки) =================== //

interface PasswdUserData {
    system?: boolean,
    local: true,
    uid: number,
    login: string,
    fname?: string,
    home: string
}

async function getPasswdUsers(sys: boolean, minNonSystemUid: number | null): Promise<PasswdUserData[]> {
    let list: PasswdUserData[] = [];

    const stream = fs.createReadStream('/etc/passwd', { encoding: 'utf8' });
    const lines = createInterface({ input: stream, crlfDelay: NaN, historySize: 0 });

    for await (const line of lines) {

        // Linux passwd(5):
        // 0 login name
        // 1 optional encrypted password
        // 2 numerical user ID            <- это UID
        // 3 numerical group ID
        // 4 user name or comment field
        // 5 user home directory           <- как раз нужно это поле 
        // 6 optional user command interpreter       

        const columns = line.split(':');

        // Некорректный формат строки.
        if (columns.length < 7) continue;

        // Некорректный идентификатор пользователя.
        const uid = parseInt(columns[2]);
        if (isNaN(uid)) continue;

        // 65534 - nfsnobody специальное значение, с группами тоже самое
        // 4294967294 - в некоторых дистр было такое значение для nfsnobody
        // по идеи эти значения где-то хранятся и их нужно читать
        const system = (minNonSystemUid != null && uid < minNonSystemUid) || uid === 65534 || uid === 4294967294;
        // TODO: какое значение sys лучше передавать в функцию?
        if (!sys && system) continue;

        const user: PasswdUserData = {
            system: system,
            local: true,
            uid: uid,
            login: columns[0],
            home: columns[5],

            // Some tools used to create the account add the real-name as a GECOS field (comma separated)
            // 1. User's full name (or application name, if the account is for a program)
            // 2. Building and room number or contact person
            // 3. Office telephone number
            // 4. Any other contact information (pager number, fax, etc.)

            // Поэтому берем только "User's full name" (до первой запятой)
            fname: columns[4] ? columns[4].split(',')[0] : ''
        };

        list.push(user);
    }

    return list;
}

// TODO: помимо использования passwd пользователей подключить доменных пользователей
// =================== SSSD (доменные учетки) =================== //

const HOME = '/home';

/**
 * в результате значения будут строками
 */
// const iniStrParsingOpts: ParserOptions = {
//     ignoreMissingAssign: true,
//     merge: true,
//     inherit: false,
//     dotKey: false,
//     nativeType: false,
//     mstring: false,
//     assign: [':', '=']
// };


async function getUserProfileUids(minNonSystemUid: number | null): Promise<number[]> {
    const uids = new Set<number>();

    // TODO: протестировать учёт настроек и при необходимости доработать для всех(более сложных) случаев
    // subdomain_homedir 
    // override_homedir
    // fallback_homedir
    // homedir_substring
    // не забыть секции domain-ов которые тоже имеют такие настройки 
    // из /etc/sssd/sssd.conf
    // https://linux.die.net/man/5/sssd.conf
    // https://man.archlinux.org/man/sssd.conf.5.en
    // sss_override
    // !!! home директория может быть прописана в аттибутах аккаунта, и тогда мы её пока не увидим
    // !!! homedir может не создаваться при логине при определённых настройках, что с этим делать?
    let homeRoots = new Map<string, number>();
    homeRoots.set(HOME, 2);

    try {
        const sssdConfText = await fs.promises.readFile("/etc/sssd/sssd.conf", "utf-8");
        const sssdConf = parse(sssdConfText); //, iniStrParsingOpts);
        if (sssdConf) {
            fillHomesFromSssdConfHomeDirSection(homeRoots, sssdConf["nss"]);

            for (const key in sssdConf) {
                if (Object.prototype.hasOwnProperty.call(sssdConf, key)) {
                    if (key.startsWith("domain/")) {
                        try {
                            fillHomesFromSssdConfHomeDirSection(homeRoots, sssdConf[key]);
                        } catch (error) {
                            //ignore
                        }
                    }
                }
            }
        }
    } catch (error) {
        // ignore
    }

    const promises: Promise<void>[] = [];
    homeRoots.forEach((async (key, homeRoot) => {
        // sanity check
        if (!homeRoot || homeRoot === "/") return;

        for (const home of await fs.promises.readdir(homeRoot, { withFileTypes: true })) {
            if (!home.isDirectory()) return;

            // TODO: искать gtk, fly-fm, .... в этой папке
            // взять UID пользователя как владельца этой папки через fs.stat()

        }
        // promises.push(getUidsSafe(homeRoot[0], minNonSystemUid, uids, 0, homeRoot[1]));
    }));

    await Promise.all(promises);

    return Array.from(uids);
}

function fillHomesFromSssdConfHomeDirSection(searchRoots: Map<string, number>, section: Record<string, any> | null) {
    if (!section)
        return;

    const override_homedir = section["override_homedir"];
    const fallback_homedir = section["fallback_homedir"];
    const subdomain_homedir = section["subdomain_homedir"];
    const homedir_substring = section["homedir_substring"];

    if (override_homedir) {
        const searchRoot = getRootFromOverrideHomedir(override_homedir, homedir_substring);
        const currentDepth = searchRoots.get(searchRoot.homeRoot);
        if (currentDepth == null || currentDepth < searchRoot.depth)
            searchRoots.set(searchRoot.homeRoot, searchRoot.depth);
    } else if (subdomain_homedir) {
        const searchRoot = getRootFromOverrideHomedir(subdomain_homedir, homedir_substring);
        const currentDepth = searchRoots.get(searchRoot.homeRoot);
        if (currentDepth == null || currentDepth < searchRoot.depth)
            searchRoots.set(searchRoot.homeRoot, searchRoot.depth);
    }

    if (fallback_homedir) {
        const searchRoot = getRootFromOverrideHomedir(fallback_homedir, homedir_substring);
        const currentDepth = searchRoots.get(searchRoot.homeRoot);
        if (currentDepth == null || currentDepth < searchRoot.depth)
            searchRoots.set(searchRoot.homeRoot, searchRoot.depth);
    }
}

function getRootFromOverrideHomedir(str: string, homedir_substring: string) {
    let depth = 0;
    const homeRoot = str
        // заменяем шаблоны с %
        .replace(/(%\S)/g, (m, g) => {
            switch (g) {
                case "%%":
                    return "%";
                case "%H":
                    return homedir_substring || "";
                default:
                    depth++;
                    return "";
            }
        })
        // убираем дублирующие слеши
        .replace(/([^:]\/)\/+/g, "$1")
        // убираем конечный слеш
        .replace(/\/$/g, "");

    return {
        homeRoot,
        depth,
    }
}

/**
 * Точка входа приложения
 */
main();