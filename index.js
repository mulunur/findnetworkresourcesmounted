"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
function getNetworkResourcesMounts() {
    return new Promise(function (resolve, reject) {
        fs.readFile("/proc/self/mountinfo", "utf8", function (err, data) {
            if (err) {
                console.error("Ошибка чтения /proc/self/mountinfo:", err);
                reject(err);
                return;
            }
            console.log(data);
            var networkMounts = data
                .split("\n")
                .map(function (line) { return line.split(" "); })
                .filter(function (parts) { return parts.length > 8 && (parts[8] === "cifs" || parts[8] === "nfs"); })
                .map(function (parts) { return ({
                device: parts[2],
                mountpoint: parts[4],
                fstype: parts[8],
                options: parts[9]
            }); });
            resolve(networkMounts);
        });
    });
}
getNetworkResourcesMounts()
    .then(function (mounts) {
    console.log("Сетевые диски:", mounts);
})
    .catch(function (err) {
    console.error("Ошибка:", err);
});
