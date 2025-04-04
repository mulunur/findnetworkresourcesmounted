import * as fs from "fs";

interface NetworkResourceMounted {
    device: string;     // Источник (например, //192.168.1.100/share)
    mountpoint: string; // Точка монтирования
    fstype: string;     // Тип файловой системы (cifs или nfs)
    options: string;    // Опции монтирования
}

function getNetworkResourcesMounts(): Promise<NetworkResourceMounted[]> {
    return new Promise((resolve, reject) => {
        fs.readFile("/proc/self/mountinfo", "utf8", (err, data) => {
            if (err) {
                console.error("Ошибка чтения /proc/self/mountinfo:", err);
                reject(err);
                return;
            }

            console.log(data)
            const networkMounts: NetworkResourceMounted[] = data
                .split("\n")
                .map(line => line.split(" "))
                .filter(parts => parts.length > 8 && (parts[8] === "cifs" || parts[8] === "nfs"))
                .map(parts => ({
                    device: parts[2],      
                    mountpoint: parts[4],  
                    fstype: parts[8],      
                    options: parts[9]      
                }));

            resolve(networkMounts);
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