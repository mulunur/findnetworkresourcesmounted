import { exec } from "child_process";
import * as fs from "fs";
import * as os from "os";
const path = require("path");

interface NetworkResourceMounted {
    device: string;     // Сетевой путь (//192.168.1.100/share)
    mountpoint: string; // Точка монтирования
    fstype: string;     // Файловая система
    options: string;    // Опции монтирования
}

function getNetworkResourcesMounts(): Promise<NetworkResourceMounted[]> {
    const platform = os.platform();

    if (platform === "linux") {
        return getLinuxNetworkMounts();
    } else if (platform === "win32") {
        return getWindowsNetworkMounts();
    } else {
        return Promise.reject(`ОС ${platform} не поддерживается.`);
    }
}

function getLinuxNetworkMounts(): Promise<NetworkResourceMounted[]> {
    const paths = ["/proc/self/mountinfo", "/etc/mtab"]
    return new Promise(async (resolve, reject) => {
        for (const path of paths) {
            try {
                const data = await fs.promises.readFile(path, "utf8");
                const mounts: NetworkResourceMounted[] = data
                    .split("\n")
                    .map(line => line.split(" "))
                    .filter(parts => parts.length > 8 && (parts[8] === "cifs" || parts[8] === "nfs"))
                    .map(parts => ({
                        device: parts[2],
                        mountpoint: parts[4],
                        fstype: parts[8],
                        options: parts[9]
                    }));
                resolve(mounts);
                break;
            } catch (err) {
                console.error("Ошибка чтения /proc/self/mountinfo:", err);
            }
        }
        reject()
    });
}

function getWindowsNetworkMounts(): Promise<NetworkResourceMounted[]> {
    const shortcutSuffix = path.join("AppData", "Roaming", "Microsoft", "Windows", "Network Shortcuts");
    const usersRoot = "C:\\Users";
    const users = fs.readdirSync(usersRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    return new Promise((resolve, reject) => {
        const mounts: NetworkResourceMounted[] = [];

        for (const user of users) {
            const shortcutPath = path.join(usersRoot, user, shortcutSuffix);
            if (fs.existsSync(shortcutPath)) {
                const files = fs.readdirSync(shortcutPath);
                for (const file of files) {
                    mounts.push({
                        device: path.join(shortcutPath, file),
                        mountpoint: "",
                        fstype: "cifs",
                        options: ""
                    });
                }
            }
        }

        exec("net use", { encoding: "utf8" }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            const lines = stdout.split("\n")
                .map(line => line.trim())
                .filter(line => line && !line.startsWith("Status") && !line.startsWith("---") && !line.includes("The command completed"));

            for (const line of lines) {
                const parts = line.split(/\s+/);

                if (parts.length >= 3) {
                    const [status, local, remote] = parts;
                    mounts.push({
                        device: remote,
                        mountpoint: local,
                        fstype: "cifs",
                        options: status
                    });
                }
            }

            resolve(mounts);
        });
    });
}

getNetworkResourcesMounts()
    .then(mounts => {
        console.log("Сетевые диски:", mounts);
    })
    .catch(err => {
        console.error("Ошибка:", err);
    });