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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
var child_process_1 = require("child_process");
var fs = require("fs");
var os = require("os");
var path = require("path");
var util = require("util");
var iconv = require("iconv-lite");
var util_1 = require("util");
var readline_1 = require("readline");
var _a = require('./winnetwork.node'), netEnumCb = _a.netEnum, netEnumScope = _a.netEnumScope, netEnumType = _a.netEnumType, netEnumUsage = _a.netEnumUsage, netEnumDisplayType = _a.netEnumDisplayType;
var netEnum = (0, util_1.promisify)(netEnumCb);
var Platform;
(function (Platform) {
    Platform["Linux"] = "linux";
    Platform["Win32"] = "win32";
})(Platform || (Platform = {}));
var NetworkFSNames;
(function (NetworkFSNames) {
    NetworkFSNames["undefined"] = "";
    NetworkFSNames["prlfs"] = "prl_fs";
    NetworkFSNames["nfs"] = "nfs";
    NetworkFSNames["cifs"] = "cifs";
    NetworkFSNames["smbfs"] = "smbfs";
    NetworkFSNames["sshfs"] = "sshfs";
})(NetworkFSNames || (NetworkFSNames = {}));
var getPlatformSpecificNetworkResourcesMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var platform;
    return __generator(this, function (_a) {
        platform = os.platform();
        try {
            if (platform === Platform.Linux) {
                return [2 /*return*/, getLinuxNetworkMounts()];
            }
            else if (platform === Platform.Win32) {
                return [2 /*return*/, Promise.resolve(getWindowsNetworkMounts())];
            }
            else {
                return [2 /*return*/, Promise.reject("\u041E\u0421 ".concat(platform, " \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F."))];
            }
        }
        catch (e) {
            console.log(e);
            return [2 /*return*/, Promise.reject(e)];
        }
        return [2 /*return*/];
    });
}); };
var getLinuxNetworkMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var pathsToMountInfo, FstabColumnNamesPosition, MtabColumnNamesPosition;
    return __generator(this, function (_a) {
        pathsToMountInfo = ["/proc/self/mountinfo", "/etc/fstab"];
        (function (FstabColumnNamesPosition) {
            FstabColumnNamesPosition[FstabColumnNamesPosition["path"] = 2] = "path";
            FstabColumnNamesPosition[FstabColumnNamesPosition["mountpoint"] = 4] = "mountpoint";
            FstabColumnNamesPosition[FstabColumnNamesPosition["fstype"] = 8] = "fstype";
            FstabColumnNamesPosition[FstabColumnNamesPosition["options"] = 9] = "options";
        })(FstabColumnNamesPosition || (FstabColumnNamesPosition = {}));
        ;
        (function (MtabColumnNamesPosition) {
            MtabColumnNamesPosition[MtabColumnNamesPosition["path"] = 4] = "path";
            MtabColumnNamesPosition[MtabColumnNamesPosition["mountpoint"] = 3] = "mountpoint";
            MtabColumnNamesPosition[MtabColumnNamesPosition["fstype"] = 8] = "fstype";
            MtabColumnNamesPosition[MtabColumnNamesPosition["options"] = 9] = "options";
        })(MtabColumnNamesPosition || (MtabColumnNamesPosition = {}));
        ;
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
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
                                .filter(function (parts) {
                                return Object.values(NetworkFSNames).includes(parts[MtabColumnNamesPosition.fstype]);
                            })
                                .map(function (parts) { return ({
                                path: parts[MtabColumnNamesPosition.path],
                                mountpoint: parts[MtabColumnNamesPosition.mountpoint],
                                fstype: parts[MtabColumnNamesPosition.fstype],
                                userSid: "",
                                options: parts.slice(9).join(" "),
                            }); });
                            resolve(mounts);
                            return [3 /*break*/, 6];
                        case 4:
                            err_1 = _a.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6:
                            reject();
                            return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getNetworkShortcutMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var mounts, execFileAsync, psScriptAllUsersDynamic, psProcess, iface, _a, iface_1, iface_1_1, line, json, parsed, e_1_1;
    var _b, e_1, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                mounts = [];
                execFileAsync = util.promisify(child_process_1.execFile);
                psScriptAllUsersDynamic = "\n$shell = New-Object -ComObject Shell.Application\n\n# \u0432\u0441\u0435 SID \u0438\u0437 HKEY_USERS, \u0431\u0435\u0437 \u043A\u043B\u0430\u0441\u0441\u043E\u0432\n$loadedSIDs = Get-ChildItem Registry::HKEY_USERS | Where-Object {\n    $_.Name -notmatch '_Classes$'\n}\n\nforeach ($sidKey in $loadedSIDs) {\n    $sid = $sidKey.PSChildName\n    $appDataPath = (Get-ItemProperty -Path (\"Registry::HKEY_USERS\\$sid\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders\")).AppData\n    Write-Output (\"AppDataPath for $sid $appDataPath\")\n    if (-not $appDataPath) { continue }\n\n    $networkShortcutsPath = Join-Path $appDataPath 'Microsoft\\Windows\\Network Shortcuts'\n    if (-not (Test-Path $networkShortcutsPath)) { \n        Write-Output \"Not found: $networkShortcutsPath\"\n        continue \n    }\n\n    $folder = $shell.NameSpace($networkShortcutsPath)\n    if ($null -eq $folder) { \n    Write-Output \"Folder COM object null for $networkShortcutsPath\"\n    continue }\n\n    foreach ($item in $folder.Items()) {\n        if ($item.IsLink) {\n            $target = $item.GetLink().Path\n            $obj = @{\n                name = $item.Name\n                path = $target\n                sid = $sid\n            }\n            $json = $obj | ConvertTo-Json -Compress -Depth 2\n            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))\n            Write-Host $b64\n        }\n    }\n}\n";
                psProcess = (0, child_process_1.spawn)('powershell.exe', [
                    '-ExecutionPolicy', 'ByPass',
                    '-NoLogo',
                    '-NoProfile',
                    '-Command', psScriptAllUsersDynamic
                ], { stdio: ['ignore', 'pipe', 'inherit'] });
                iface = (0, readline_1.createInterface)({
                    input: psProcess.stdout,
                    crlfDelay: Infinity
                });
                _e.label = 1;
            case 1:
                _e.trys.push([1, 6, 7, 12]);
                _a = true, iface_1 = __asyncValues(iface);
                _e.label = 2;
            case 2: return [4 /*yield*/, iface_1.next()];
            case 3:
                if (!(iface_1_1 = _e.sent(), _b = iface_1_1.done, !_b)) return [3 /*break*/, 5];
                _d = iface_1_1.value;
                _a = false;
                line = _d;
                try {
                    json = Buffer.from(line.trim(), 'base64').toString('utf8');
                    parsed = JSON.parse(json);
                    mounts.push({
                        path: parsed.path,
                        mountpoint: parsed.name,
                        fstype: "",
                        userSid: parsed.sid,
                        options: "Network Folder"
                    });
                }
                catch (err) {
                    console.error("Ошибка декодирования строки:", line);
                }
                _e.label = 4;
            case 4:
                _a = true;
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_1_1 = _e.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 7:
                _e.trys.push([7, , 10, 11]);
                if (!(!_a && !_b && (_c = iface_1.return))) return [3 /*break*/, 9];
                return [4 /*yield*/, _c.call(iface_1)];
            case 8:
                _e.sent();
                _e.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [2 /*return*/, Promise.resolve(mounts)];
        }
    });
}); };
var getNetworkRegistryMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var mounts, script, ps, rl, _a, rl_1, rl_1_1, line, decoded, obj, e_2_1;
                var _b, e_2, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            mounts = [];
                            script = "\n    function WriteBase64($s) { \n        Write-Host ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s)))\n    }\n\n    $userKeys = Get-ChildItem -Path Registry::HKEY_USERS\n    foreach ($key in $userKeys) { \n        \n        $sid = $key.PSChildName\n\n        $networkKeyPath = \"Registry::HKEY_USERS\\$sid\\Network\"\n\n        if (Test-Path $networkKeyPath) {\n            try {\n                $networkKey = Get-ChildItem -Path $networkKeyPath\n                } catch { Write-Error $_}\n\n            foreach ($netKey in $networkKey) {\n            \n                $values = Get-ItemProperty -Path $netKey.PSPath\n\n                $obj = @{\n                        userSid = $sid\n                        mountpoint = $netKey.PSChildName\n                        remotePath = $values.RemotePath\n                        providerName = $values.ProviderName\n                    }\n                $json = $obj | ConvertTo-Json -Compress\n                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)\n                $base64 = [System.Convert]::ToBase64String($bytes)\n                Write-Host $base64\n            }\n        }\n    }";
                            ps = (0, child_process_1.spawn)("powershell.exe", [
                                "-NoProfile",
                                "-ExecutionPolicy", "Bypass",
                                "-Command", script
                            ], { stdio: ['ignore', 'pipe', 'inherit'] });
                            rl = (0, readline_1.createInterface)({ input: ps.stdout, crlfDelay: Infinity });
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 6, 7, 12]);
                            _a = true, rl_1 = __asyncValues(rl);
                            _e.label = 2;
                        case 2: return [4 /*yield*/, rl_1.next()];
                        case 3:
                            if (!(rl_1_1 = _e.sent(), _b = rl_1_1.done, !_b)) return [3 /*break*/, 5];
                            _d = rl_1_1.value;
                            _a = false;
                            line = _d;
                            try {
                                decoded = Buffer.from(line, 'base64').toString('utf8');
                                obj = JSON.parse(decoded);
                                mounts.push(obj);
                            }
                            catch (err) {
                                console.error("Ошибка декодирования строки:", line);
                            }
                            _e.label = 4;
                        case 4:
                            _a = true;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_2_1 = _e.sent();
                            e_2 = { error: e_2_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _e.trys.push([7, , 10, 11]);
                            if (!(!_a && !_b && (_c = rl_1.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _c.call(rl_1)];
                        case 8:
                            _e.sent();
                            _e.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_2) throw e_2.error;
                            return [7 /*endfinally*/];
                        case 11: return [7 /*endfinally*/];
                        case 12:
                            resolve(mounts);
                            return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getNetUseMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var netUseShares, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)];
            case 1:
                netUseShares = (_a.sent()).map(humanize);
                console.log("res от native net use", netUseShares.map(mapToNetworkResource));
                return [2 /*return*/, (netUseShares.map(mapToNetworkResource))];
            case 2:
                e_3 = _a.sent();
                console.log("Ошибка использования native модуля для net use", e_3);
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
var getNetUseMountsOld = function () {
    return new Promise(function (resolve) {
        var utf8Encoding = "@chcp 65001 >nul"; // может влиять на вывод, м.б. поэтому не работал декод? (узнать больше)
        var kyrillicEncoding = "win1251";
        var command = "net use";
        (0, child_process_1.exec)("".concat(command), { encoding: "buffer" }, function (error, stdout, stderr) {
            var mounts = [];
            if (error) {
                return resolve(mounts);
            }
            var lines = iconv.decode(stdout, kyrillicEncoding)
                .replace(/^(-+)$/gm, '') // удаление "-----------"-строк
                .split('\n')
                .map(function (line) { return line.replace(/[\r\n]/g, ''); })
                .filter(Boolean) // удаление пустых строк
                .slice(1) // удаление первой строки ("New connections...")
                .slice(1) // удаление заголовков таблицы ("Status   Local...")
                .slice(0, -1); // удаление последней строки ("The command completed...")
            var parts = lines;
            for (var i = 0; i + 2 < parts.length; i += 3) {
                var local = parts[i];
                var remote = parts[i + 1];
                var networkType = parts[i + 2];
                mounts.push({
                    path: remote,
                    mountpoint: local,
                    fstype: NetworkFSNames.undefined,
                    userSid: "",
                    options: networkType
                });
            }
            resolve(mounts);
        });
    });
};
var getWindowsNetworkMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var networkShortcuts, networkMounts, registryNetworkMounts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getNetworkShortcutMounts()];
            case 1:
                networkShortcuts = _a.sent();
                return [4 /*yield*/, getNetUseMounts()];
            case 2:
                networkMounts = _a.sent();
                return [4 /*yield*/, getNetworkRegistryMounts()];
            case 3:
                registryNetworkMounts = _a.sent();
                return [2 /*return*/, __spreadArray(__spreadArray(__spreadArray([], networkShortcuts, true), networkMounts, true), registryNetworkMounts, true)];
        }
    });
}); };
// Вспомогательные функции 
function keyOf(rec, val) {
    var idx = Object.values(rec).indexOf(val);
    if (idx < 0)
        return undefined;
    return Object.keys(rec)[idx];
}
function humanize(res) {
    console.log("mapNetUseNative humanize res", res);
    return {
        scope: keyOf(netEnumScope, res.scope),
        type: keyOf(netEnumType, res.type),
        usage: keyOf(netEnumUsage, res.usage),
        displayType: keyOf(netEnumDisplayType, res.displayType),
        localName: res.localName,
        remoteName: res.remoteName,
        comment: res.comment,
    };
}
function mapToNetworkResource(rec) {
    console.log("mapNetUseNative");
    return {
        path: rec.remoteName,
        mountpoint: rec.localName,
        fstype: rec.displayType,
        userSid: rec.sid,
        options: rec.commnet
    };
}
// Выполняемая функция
getPlatformSpecificNetworkResourcesMounts()
    .then(function (mounts) {
    console.log(mounts);
})
    .catch(function (err) {
    console.error("Ошибка:", err);
});
