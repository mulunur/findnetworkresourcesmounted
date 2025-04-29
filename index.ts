import { exec, execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
const path = require("path");
import * as util from "util";
import * as iconv from "iconv-lite";

interface NetworkResourceMounted {
    path: string;       // Сетевой путь
    mountpoint: string; // Точка монтирования
    fstype: string;     // Файловая система
    options: string;    // Другие характеристики сетевого ресурса
}

enum Platform {
    Linux = "linux",
    Win32 = "win32",
}

enum NetworkFSNames {
    undefined = "",
    prl_fs = "prl_fs",
    nfs = "nfs",
    cifs = "cifs",
    smbfs = "smbfs",
    sshfs = "sshfs",
}

function getNetworkResourcesMounts(): Promise<NetworkResourceMounted[]> {
    const platform: NodeJS.Platform = os.platform();

    if (platform === Platform.Linux) {
        return getLinuxNetworkMounts();
    } else if (platform === Platform.Win32) {
        return getWindowsNetworkMounts();
    } else {
        return Promise.reject(`ОС ${platform} не поддерживается.`);
    }
}

function getLinuxNetworkMounts(): Promise<NetworkResourceMounted[]> {
    const pathsToMountInfo = ["/proc/self/mountinfo", "/etc/fstab"];
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
                const data = await fs.promises.readFile(path, "utf8");
                const mounts: NetworkResourceMounted[] = data
                    .split("\n")
                    .map(line => line.split(/\s+/))
                    .filter(parts => Object.values(NetworkFSNames).includes(parts[MtabColumnNamesPosition.fstype] as NetworkFSNames))
                    .map(parts => ({
                        path: parts[MtabColumnNamesPosition.path],
                        mountpoint: parts[MtabColumnNamesPosition.mountpoint],
                        fstype: parts[MtabColumnNamesPosition.fstype],
                        options: parts.slice(9).join(" "),
                    }));
                resolve(mounts);
                break;
            } catch (err) {
                console.error(`Ошибка чтения ${path}:`, err);
            }
        }
        reject();
    });
}

async function getNetworkShortcutMountsAsync(): Promise<NetworkResourceMounted[]> {
    const mounts: NetworkResourceMounted[] = [];

    const psScriptPath = path.resolve(__dirname, "./get-network-shortcuts.ps1");
    const execFileAsync = util.promisify(execFile);
    try {
        const { stdout } = await execFileAsync("powershell", ["-File", psScriptPath]);
        //const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psScriptPath]);
        const lines = stdout.trim().split(/\r?\n/);
        for (const line of lines) {
            const match = /^\[(.+?)\] => (.+)$/.exec(line);
            if (match) {
                const [, name, target] = match;
                mounts.push({
                    path: target,
                    mountpoint: "",
                    fstype: "networkShortcut",
                    options: "Network Folder"
                });
            }
        }
    } catch (e) {
        console.error("Failed to run PowerShell script:", e);
    }
    return mounts;
}

function getNetUseMounts(): Promise<NetworkResourceMounted[]> {
    return new Promise((resolve) => {
        exec("chcp 65001 && net use", { encoding: "buffer" }, (error, stdout, stderr) => {
            const mounts: NetworkResourceMounted[] = [];

            if (error) {
                console.warn("Не удалось получить сетевые устройства через net use:", error.message);
                return resolve([]);
            }

            const decodedOutput = iconv.decode(stdout, "win1251");

            let cleanedOutput = decodedOutput
                .replace(/(Состояние.*|---.*|Команда выполнена успешно.*|Active code page: 65001.*|New connections will be remembered.*|Status.*|The command completed successfully.*)/gi, '')
                .trim()
                .replace(/\r?\n\s*/g, '  ');

            const parts = cleanedOutput.split(/\s{2,}/).filter(Boolean);

            for (let i = 0; i + 2 < parts.length; i += 3) {
                const local = parts[i];
                const remote = parts[i + 1];
                const networkType = parts[i + 2];

                mounts.push({
                    path: remote,
                    mountpoint: local,
                    fstype: NetworkFSNames.undefined,
                    options: networkType
                });
            }

            resolve(mounts);
        });
    });
}

export async function getWindowsNetworkMounts(): Promise<NetworkResourceMounted[]> {
    const shortcuts = await getNetworkShortcutMountsAsync();

    return getNetUseMounts().then((netUseMounts) => {
        return [...shortcuts, ...netUseMounts];
    });
}


getNetworkResourcesMounts()
    .then(mounts => {
        console.log(mounts);
    })
    .catch(err => {
        console.error("Ошибка:", err);
    });