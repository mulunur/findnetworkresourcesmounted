"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindowsNetworkMounts = getWindowsNetworkMounts;
var child_process_1 = require("child_process");
var fs = require("fs");
var os = require("os");
var path = require("path");
var iconv = require("iconv-lite");
var Platform;
(function (Platform) {
    Platform["Linux"] = "linux";
    Platform["Win32"] = "win32";
})(Platform || (Platform = {}));
var NetworkFSNames;
(function (NetworkFSNames) {
    NetworkFSNames["undefined"] = "";
    NetworkFSNames["prl_fs"] = "prl_fs";
    NetworkFSNames["nfs"] = "nfs";
    NetworkFSNames["cifs"] = "cifs";
    NetworkFSNames["smbfs"] = "smbfs";
    NetworkFSNames["sshfs"] = "sshfs";
})(NetworkFSNames || (NetworkFSNames = {}));
function getNetworkResourcesMounts() {
    var platform = os.platform();
    if (platform === Platform.Linux) {
        return getLinuxNetworkMounts();
    }
    else if (platform === Platform.Win32) {
        return getWindowsNetworkMounts();
    }
    else {
        return Promise.reject("\u041E\u0421 ".concat(platform, " \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F."));
    }
}
function getLinuxNetworkMounts() {
    var _this = this;
    var pathsToMountInfo = ["/proc/self/mountinfo", "/etc/fstab"];
    var FstabColumnNamesPosition;
    (function (FstabColumnNamesPosition) {
        FstabColumnNamesPosition[FstabColumnNamesPosition["path"] = 2] = "path";
        FstabColumnNamesPosition[FstabColumnNamesPosition["mountpoint"] = 4] = "mountpoint";
        FstabColumnNamesPosition[FstabColumnNamesPosition["fstype"] = 8] = "fstype";
        FstabColumnNamesPosition[FstabColumnNamesPosition["options"] = 9] = "options";
    })(FstabColumnNamesPosition || (FstabColumnNamesPosition = {}));
    ;
    var MtabColumnNamesPosition;
    (function (MtabColumnNamesPosition) {
        MtabColumnNamesPosition[MtabColumnNamesPosition["path"] = 4] = "path";
        MtabColumnNamesPosition[MtabColumnNamesPosition["mountpoint"] = 3] = "mountpoint";
        MtabColumnNamesPosition[MtabColumnNamesPosition["fstype"] = 8] = "fstype";
        MtabColumnNamesPosition[MtabColumnNamesPosition["options"] = 9] = "options";
    })(MtabColumnNamesPosition || (MtabColumnNamesPosition = {}));
    ;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var _i, pathsToMountInfo_1, path_1, data, mounts, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, pathsToMountInfo_1 = pathsToMountInfo;
                    _a.label = 1;
                case 1:
                    if (!(_i < pathsToMountInfo_1.length)) return [3 /*break*/, 6];
                    path_1 = pathsToMountInfo_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fs.promises.readFile(path_1, "utf8")];
                case 3:
                    data = _a.sent();
                    mounts = data
                        .split("\n")
                        .map(function (line) { return line.split(/\s+/); })
                        .filter(function (parts) { return Object.values(NetworkFSNames).includes(parts[MtabColumnNamesPosition.fstype]); })
                        .map(function (parts) { return ({
                        path: parts[MtabColumnNamesPosition.path],
                        mountpoint: parts[MtabColumnNamesPosition.mountpoint],
                        fstype: parts[MtabColumnNamesPosition.fstype],
                        options: parts.slice(9).join(" "),
                    }); });
                    resolve(mounts);
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F ".concat(path_1, ":"), err_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    reject();
                    return [2 /*return*/];
            }
        });
    }); });
}
// function getWinShortcutTarget(networkShortcutPath: string): Promise<string | null> {
//     const command = ``;
//     return new Promise((resolve, reject) => {
//         exec(command, { encoding: "utf8" }, (error, stdout) => {
//             if (error) {
//                 console.warn("Не удалось получить сетевое расположение", error.message);
//             } else {
//                 resolve(stdout.trim());
//             }
//         });
//     });
// }
function getNetworkShortcutMountsAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var mounts, networkShortcutSuffix, usersDirectory, userDirs, users, _i, users_1, user, shortcutPath, networkShortcuts, _a, networkShortcuts_1, shortcut, _1, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mounts = [];
                    networkShortcutSuffix = path.join("AppData", "Roaming", "Microsoft", "Windows", "Network Shortcuts");
                    usersDirectory = "C:\\Users";
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, fs.promises.readdir(usersDirectory, { withFileTypes: true })];
                case 2:
                    userDirs = _b.sent();
                    users = userDirs.filter(function (x) { return x.isDirectory(); }).map(function (d) { return d.name; });
                    _i = 0, users_1 = users;
                    _b.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 8];
                    user = users_1[_i];
                    shortcutPath = path.join(usersDirectory, user, networkShortcutSuffix);
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fs.promises.readdir(shortcutPath)];
                case 5:
                    networkShortcuts = _b.sent();
                    for (_a = 0, networkShortcuts_1 = networkShortcuts; _a < networkShortcuts_1.length; _a++) {
                        shortcut = networkShortcuts_1[_a];
                        mounts.push({
                            path: path.join(shortcutPath, shortcut),
                            mountpoint: "",
                            fstype: NetworkFSNames.undefined,
                            options: "Network Folder"
                        });
                    }
                    return [3 /*break*/, 7];
                case 6:
                    _1 = _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _b.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, mounts];
            }
        });
    });
}
function getNetUseMounts() {
    return new Promise(function (resolve) {
        (0, child_process_1.exec)("chcp 65001 && net use", { encoding: "buffer" }, function (error, stdout, stderr) {
            var mounts = [];
            if (error) {
                console.warn("Не удалось получить сетевые устройства через net use:", error.message);
                return resolve([]);
            }
            var decodedOutput = iconv.decode(stdout, "win1251");
            var cleanedOutput = decodedOutput
                .replace(/(Состояние.*|---.*|Команда выполнена успешно.*|Active code page: 65001.*|New connections will be remembered.*|Status.*|The command completed successfully.*)/gi, '')
                .trim()
                .replace(/\r?\n\s*/g, '  ');
            var parts = cleanedOutput.split(/\s{2,}/).filter(Boolean);
            for (var i = 0; i + 2 < parts.length; i += 3) {
                var local = parts[i];
                var remote = parts[i + 1];
                var networkType = parts[i + 2];
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
function getWindowsNetworkMounts() {
    return __awaiter(this, void 0, void 0, function () {
        var shortcuts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNetworkShortcutMountsAsync()];
                case 1:
                    shortcuts = _a.sent();
                    return [2 /*return*/, getNetUseMounts().then(function (netUseMounts) {
                            return __spreadArray(__spreadArray([], shortcuts, true), netUseMounts, true);
                        })];
            }
        });
    });
}
getNetworkResourcesMounts()
    .then(function (mounts) {
    console.log(mounts);
})
    .catch(function (err) {
    console.error("Ошибка:", err);
});
