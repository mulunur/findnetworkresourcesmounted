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
    prlfs = "prl_fs",
    nfs = "nfs",
    cifs = "cifs",
    smbfs = "smbfs",
    sshfs = "sshfs",
}

const getNetworkResourcesMounts = (): Promise<NetworkResourceMounted[]> => {
    const platform: NodeJS.Platform = os.platform();

    if (platform === Platform.Linux) {
        return getLinuxNetworkMounts();
    } else if (platform === Platform.Win32) {
        return getWindowsNetworkMounts();
    }
     else {
        return Promise.reject(`ОС ${platform} не поддерживается.`);
     }
}

const getLinuxNetworkMounts = async (): Promise<NetworkResourceMounted[]> => {
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
                    .filter(parts => 
                        Object.values(NetworkFSNames).includes(parts[MtabColumnNamesPosition.fstype] as NetworkFSNames))
                    .map(parts => ({
                        path: parts[MtabColumnNamesPosition.path],
                        mountpoint: parts[MtabColumnNamesPosition.mountpoint],
                        fstype: parts[MtabColumnNamesPosition.fstype],
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

const getNetworkShortcutMountsAsync = async (): Promise<NetworkResourceMounted[]> => {
    const mounts: NetworkResourceMounted[] = [];
    const execFileAsync = util.promisify(execFile);

    const psScript = `
        $networkShortcuts = "$env:APPDATA\\Microsoft\\Windows\\Network Shortcuts"
        if (-Not (Test-Path $networkShortcuts)) { exit }
        $shell = New-Object -ComObject Shell.Application
        $folder = $shell.NameSpace($networkShortcuts)
        if ($null -eq $folder) { exit }
        foreach ($item in $folder.Items()) {
            if ($item.IsLink) {
                $target = $item.GetLink().Path
                Write-Output "[$($item.Name)] => $target"
            }
        }
    `;

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
}

const getNetUseMounts = (): Promise<NetworkResourceMounted[]> => {
    return new Promise((resolve) => {
        const encoding = "chcp 65001"
        const command = "net use"

        exec(`${encoding} && ${command}`, { encoding: "buffer" }, (error, stdout, stderr) => {
            const mounts: NetworkResourceMounted[] = [];

            if (error) {
                return resolve(mounts);
            }

            const lines = iconv.decode(stdout, "win1251")
            .replace(/^(-+)$/gm, '') // удаление "-----------"-строк
            .split('\n')
            .map((line) => line.replace(/[\r\n]/g, ''))
            .filter(Boolean)         // удаление пустых строк
            .slice(1)                // удаление первой строки ("New connections...")
            .slice(1)                // удаление заголовков таблицы ("Status   Local...")
            .slice(0, -1);           // удаление последней строки ("The command completed...")

            const parts = lines;
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

const getWindowsNetworkMounts = async(): Promise<NetworkResourceMounted[]> => {
    const networkShortcuts = await getNetworkShortcutMountsAsync();
    const networkMounts = await getNetUseMounts();
    return [...networkShortcuts, ...networkMounts];
}

getNetworkResourcesMounts()
    .then(mounts => {
        console.log(mounts);
    })
    .catch(err => {
        console.error("Ошибка:", err);
    });