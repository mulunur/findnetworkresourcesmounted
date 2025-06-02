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
exports.getLinuxNetworkMounts = void 0;
exports.getAllSystemNetworkMounts = getAllSystemNetworkMounts;
exports.getLinuxNetworkBookmarks = getLinuxNetworkBookmarks;
var child_process_1 = require("child_process");
var fs = require("fs");
var os = require("os");
var util_1 = require("util");
var readline_1 = require("readline");
var path = require("path");
var xml2js = require("xml2js");
var netEnum;
var netEnumCb;
var netEnumScope;
var netEnumType;
var netEnumUsage;
var netEnumDisplayType;
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
    NetworkFSNames["smbnetfs"] = "smbnetfs";
    NetworkFSNames["sshfs"] = "sshfs";
})(NetworkFSNames || (NetworkFSNames = {}));
var getPlatformSpecificNetworkResourcesMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var platform;
    var _a;
    return __generator(this, function (_b) {
        platform = os.platform();
        try {
            if (platform === Platform.Linux) {
                return [2 /*return*/, (0, exports.getLinuxNetworkMounts)()];
            }
            else if (platform === Platform.Win32) {
                (_a = require('./winnetwork.node'), netEnumCb = _a.netEnum, netEnumScope = _a.netEnumScope, netEnumType = _a.netEnumType, netEnumUsage = _a.netEnumUsage, netEnumDisplayType = _a.netEnumDisplayType);
                netEnum = (0, util_1.promisify)(netEnumCb);
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
/**************
*    LINUX    *
***************/
/*enum FstabColumnNamesPosition {
    path = 2,
    mountpoint = 4,
    fstype = 8,
    options = 9,
};*/
function parseFstab() {
    return __awaiter(this, arguments, void 0, function (path) {
        var entries, fileStream, rl, logicalLine, _a, rl_1, rl_1_1, origLine, line, commentIndex, fields, e_1_1;
        var _b, e_1, _c, _d;
        if (path === void 0) { path = "/etc/fstab"; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    entries = [];
                    fileStream = fs.createReadStream(path);
                    rl = (0, readline_1.createInterface)({
                        input: fileStream,
                        crlfDelay: Infinity,
                    });
                    logicalLine = "";
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
                    origLine = _d;
                    line = origLine.trim();
                    if (!line || line.startsWith("#"))
                        return [3 /*break*/, 4];
                    if (line.endsWith("\\")) {
                        logicalLine += line.slice(0, -1) + " ";
                        return [3 /*break*/, 4];
                    }
                    else {
                        logicalLine += line;
                    }
                    commentIndex = logicalLine.indexOf("#");
                    if (commentIndex !== -1)
                        logicalLine = logicalLine.slice(0, commentIndex).trim();
                    if (logicalLine) {
                        fields = logicalLine.split(/\s+/);
                        if (fields.length >= 6 && isNetworkFs(fields[2])) {
                            entries.push({
                                path: fields[0],
                                mountpoint: fields[1],
                                fstype: fields[2],
                                userSid: "", // fstab  не содержит информации о пользователе
                                options: fields[3],
                            });
                        }
                    }
                    logicalLine = "";
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
                    if (!(!_a && !_b && (_c = rl_1.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _c.call(rl_1)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12: return [2 /*return*/, entries];
            }
        });
    });
}
function parseMountInfo() {
    return __awaiter(this, arguments, void 0, function (path) {
        var entries, fileStream, rl, _a, rl_2, rl_2_1, line, parts, dashIdx, fstype, source, mountpoint, options, e_2_1;
        var _b, e_2, _c, _d;
        if (path === void 0) { path = "/proc/self/mountinfo"; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    entries = [];
                    fileStream = fs.createReadStream(path);
                    rl = (0, readline_1.createInterface)({
                        input: fileStream,
                        crlfDelay: Infinity,
                    });
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, 7, 12]);
                    _a = true, rl_2 = __asyncValues(rl);
                    _e.label = 2;
                case 2: return [4 /*yield*/, rl_2.next()];
                case 3:
                    if (!(rl_2_1 = _e.sent(), _b = rl_2_1.done, !_b)) return [3 /*break*/, 5];
                    _d = rl_2_1.value;
                    _a = false;
                    line = _d;
                    parts = line.trim().split(/\s+/);
                    dashIdx = parts.indexOf("-");
                    if (dashIdx === -1 || dashIdx + 3 > parts.length)
                        return [3 /*break*/, 4];
                    fstype = parts[dashIdx + 1];
                    source = parts[dashIdx + 2];
                    mountpoint = parts[4];
                    options = parts[5];
                    if (isNetworkFs(fstype)) {
                        entries.push({
                            path: source,
                            mountpoint: mountpoint,
                            fstype: fstype,
                            userSid: "", // Not available in mountinfo
                            options: options,
                        });
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
                    if (!(!_a && !_b && (_c = rl_2.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _c.call(rl_2)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12: return [2 /*return*/, entries];
            }
        });
    });
}
function getAllSystemNetworkMounts() {
    return __awaiter(this, void 0, void 0, function () {
        var procDir, namespaceSeen, allMounts, dirEntries, _a, _i, dirEntries_1, dirEntry, pid, namespacePath, namespaceInode, stat, nsId, _b, mountinfoPath, fileStream, rl, _c, rl_3, rl_3_1, line, parts, dashIdx, fstype, source, mountpoint, options, key, e_3_1, uniqMap, _d, allMounts_1, _e, key, item;
        var _f, e_3, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    procDir = "/proc";
                    namespaceSeen = new Set();
                    allMounts = [];
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.promises.readdir(procDir, { withFileTypes: true })];
                case 2:
                    dirEntries = _j.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _j.sent();
                    return [2 /*return*/, []];
                case 4:
                    _i = 0, dirEntries_1 = dirEntries;
                    _j.label = 5;
                case 5:
                    if (!(_i < dirEntries_1.length)) return [3 /*break*/, 22];
                    dirEntry = dirEntries_1[_i];
                    if (!dirEntry.isDirectory() || !/^\d+$/.test(dirEntry.name))
                        return [3 /*break*/, 21];
                    pid = dirEntry.name;
                    namespacePath = path.join(procDir, pid, "ns", "mnt");
                    namespaceInode = void 0;
                    _j.label = 6;
                case 6:
                    _j.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, fs.promises.readlink(namespacePath)];
                case 7:
                    namespaceInode = _j.sent(); // например, 'mnt:[4026531840]' -  только inode недостаточно, нужен и device id
                    stat = fs.statSync("".concat(procDir, "/").concat(pid, "/ns/mnt"));
                    nsId = "".concat(stat.dev, ":").concat(stat.ino);
                    if (namespaceSeen.has(nsId))
                        return [3 /*break*/, 21]; // такой namespace уже обработан
                    namespaceSeen.add(nsId);
                    return [3 /*break*/, 9];
                case 8:
                    _b = _j.sent();
                    return [3 /*break*/, 21]; // нет доступа или процесс завершился
                case 9:
                    mountinfoPath = path.join(procDir, pid, "mountinfo");
                    fileStream = void 0;
                    try {
                        fileStream = fs.createReadStream(mountinfoPath);
                    }
                    catch (_k) {
                        return [3 /*break*/, 21];
                    }
                    rl = (0, readline_1.createInterface)({
                        input: fileStream,
                        crlfDelay: Infinity,
                    });
                    _j.label = 10;
                case 10:
                    _j.trys.push([10, 15, 16, 21]);
                    _c = true, rl_3 = (e_3 = void 0, __asyncValues(rl));
                    _j.label = 11;
                case 11: return [4 /*yield*/, rl_3.next()];
                case 12:
                    if (!(rl_3_1 = _j.sent(), _f = rl_3_1.done, !_f)) return [3 /*break*/, 14];
                    _h = rl_3_1.value;
                    _c = false;
                    line = _h;
                    parts = line.trim().split(/\s+/);
                    dashIdx = parts.indexOf("-");
                    if (dashIdx === -1 || dashIdx + 3 > parts.length)
                        return [3 /*break*/, 13];
                    fstype = parts[dashIdx + 1];
                    source = parts[dashIdx + 2];
                    mountpoint = parts[4];
                    options = parts[5];
                    if (isNetworkFs(fstype)) {
                        key = "".concat(source, "|").concat(mountpoint, "|").concat(fstype);
                        allMounts.push({ key: key, item: { path: source, mountpoint: mountpoint, fstype: fstype, userSid: "", options: options } });
                    }
                    _j.label = 13;
                case 13:
                    _c = true;
                    return [3 /*break*/, 11];
                case 14: return [3 /*break*/, 21];
                case 15:
                    e_3_1 = _j.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 21];
                case 16:
                    _j.trys.push([16, , 19, 20]);
                    if (!(!_c && !_f && (_g = rl_3.return))) return [3 /*break*/, 18];
                    return [4 /*yield*/, _g.call(rl_3)];
                case 17:
                    _j.sent();
                    _j.label = 18;
                case 18: return [3 /*break*/, 20];
                case 19:
                    if (e_3) throw e_3.error;
                    return [7 /*endfinally*/];
                case 20: return [7 /*endfinally*/];
                case 21:
                    _i++;
                    return [3 /*break*/, 5];
                case 22:
                    uniqMap = new Map();
                    for (_d = 0, allMounts_1 = allMounts; _d < allMounts_1.length; _d++) {
                        _e = allMounts_1[_d], key = _e.key, item = _e.item;
                        if (!uniqMap.has(key))
                            uniqMap.set(key, item);
                    }
                    return [2 /*return*/, Array.from(uniqMap.values())];
            }
        });
    });
}
function isNetworkUri(uri) {
    if (!uri)
        return false;
    var schemes = [
        "smb://",
        "nfs://",
        "ftp://",
        "ftps://",
        "sftp://",
        "sshfs://",
    ];
    var lower = uri.toLowerCase();
    return schemes.some(function (scheme) { return lower.startsWith(scheme); });
}
// Поиск сетевых закладок текущего пользователя в различных дистрибутивах Linux.
function getLinuxNetworkBookmarks() {
    return __awaiter(this, void 0, void 0, function () {
        var home, candidates, results, _i, candidates_1, file, stat, _a, _b, _c, _d, _e, _f, _g, _h, _j, e_4;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    home = os.homedir();
                    candidates = [
                        // среда GNOME (и Alt, Red OS, АльтерОС)
                        path.join(home, ".config", "gtk-3.0", "bookmarks"),
                        // Astra Linux
                        path.join(home, ".config", "rusbitech", "fly-fm-vfs.conf"),
                        // XBEL bookmarks (Astra или другие дистрибы)
                        path.join(home, ".local", "share", "user-places.xbel"),
                    ];
                    results = [];
                    _i = 0, candidates_1 = candidates;
                    _k.label = 1;
                case 1:
                    if (!(_i < candidates_1.length)) return [3 /*break*/, 12];
                    file = candidates_1[_i];
                    _k.label = 2;
                case 2:
                    _k.trys.push([2, 10, , 11]);
                    return [4 /*yield*/, fs.promises.stat(file)];
                case 3:
                    stat = _k.sent();
                    if (!stat.isFile())
                        return [3 /*break*/, 11];
                    if (!file.endsWith("user-places.xbel")) return [3 /*break*/, 5];
                    _b = (_a = results.push).apply;
                    _c = [results];
                    return [4 /*yield*/, parseXbelBookmarks(file)];
                case 4:
                    _b.apply(_a, _c.concat([(_k.sent())]));
                    return [3 /*break*/, 9];
                case 5:
                    if (!file.endsWith("fly-fm-vfs.conf")) return [3 /*break*/, 7];
                    _e = (_d = results.push).apply;
                    _f = [results];
                    return [4 /*yield*/, parseAstraBookmarks(file)];
                case 6:
                    _e.apply(_d, _f.concat([(_k.sent())]));
                    return [3 /*break*/, 9];
                case 7:
                    _h = (_g = results.push).apply;
                    _j = [results];
                    return [4 /*yield*/, parseSimpleBookmarks(file)];
                case 8:
                    _h.apply(_g, _j.concat([(_k.sent())]));
                    _k.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_4 = _k.sent();
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 1];
                case 12: 
                // Оставляем только сетевые
                return [2 /*return*/, results.filter(function (bm) { return isNetworkUri(bm.path); })];
            }
        });
    });
}
// Парсинг простых текстовых закладок (GNOME, АльтерОС, RedOS, Alt Linux)
function parseAstraBookmarks(file) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, bookmarks, currentEntry, _i, lines_1, line;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readFile(file, "utf8")];
                case 1:
                    content = _a.sent();
                    lines = content.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
                    bookmarks = [];
                    currentEntry = {};
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        if (line.startsWith("#") || !line)
                            continue;
                        if (line.startsWith("[")) {
                            if (currentEntry.url) {
                                bookmarks.push({
                                    path: currentEntry.url,
                                    mountpoint: currentEntry.name || "",
                                    fstype: "",
                                    userSid: "Текущий пользователь",
                                    options: "Содержится в закладках проводника",
                                });
                            }
                            currentEntry = {}; // начинаем новую запись
                        }
                        else if (line.startsWith("Name=")) {
                            currentEntry.name = line.slice("Name=".length).trim();
                        }
                        else if (line.startsWith("Url=")) {
                            currentEntry.url = line.slice("Url=".length).trim(); // АльтерОС: "smb:///example example", где example может быть названием директории
                        }
                    }
                    if (currentEntry.url) {
                        bookmarks.push({
                            path: currentEntry.url,
                            mountpoint: currentEntry.name || "",
                            fstype: "",
                            userSid: "Текущий пользователь",
                            options: "Содержится в закладках проводника",
                        });
                    }
                    return [2 /*return*/, bookmarks];
            }
        });
    });
}
// Парсинг простых текстовых закладок (GNOME, АльтерОС, RedOS, Alt Linux)
function parseSimpleBookmarks(file) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, bookmarks, _i, lines_2, line;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readFile(file, "utf8")];
                case 1:
                    content = _a.sent();
                    lines = content.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
                    bookmarks = [];
                    for (_i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                        line = lines_2[_i];
                        if (line.startsWith("#") || !line)
                            continue;
                        bookmarks.push({
                            path: line,
                            mountpoint: line.split("/").filter(Boolean).pop() || "",
                            fstype: "",
                            userSid: "Текущий пользователь",
                            options: "Содержится в закладках проводника",
                        });
                    }
                    return [2 /*return*/, bookmarks];
            }
        });
    });
}
// Парсинг XBEL-файла user-places.xbel (Astra Linux)
function parseXbelBookmarks(file) {
    return __awaiter(this, void 0, void 0, function () {
        var content, bookmarks, parsed, bms, _i, bms_1, bm, uri, label;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs.promises.readFile(file, "utf8")];
                case 1:
                    content = _b.sent();
                    bookmarks = [];
                    return [4 /*yield*/, xml2js.parseStringPromise(content, { explicitArray: false })];
                case 2:
                    parsed = _b.sent();
                    if (parsed.xbel && parsed.xbel.bookmark) {
                        bms = Array.isArray(parsed.xbel.bookmark) ? parsed.xbel.bookmark : [parsed.xbel.bookmark];
                        for (_i = 0, bms_1 = bms; _i < bms_1.length; _i++) {
                            bm = bms_1[_i];
                            uri = (_a = bm["$"]) === null || _a === void 0 ? void 0 : _a.href;
                            label = undefined;
                            if (bm.title)
                                label = typeof bm.title === "string" ? bm.title : bm.title._;
                            if (uri)
                                bookmarks.push({
                                    path: uri,
                                    mountpoint: label || "",
                                    fstype: "",
                                    userSid: "Текущий пользователь",
                                    options: "Содержится в закладках проводника",
                                });
                        }
                    }
                    return [2 /*return*/, bookmarks];
            }
        });
    });
}
/**
 * Аггрегирует сетевые расположения по /proc/<pid>/mountinfo, /etc/fstab, закладкам файлового менеджера
 */
var getLinuxNetworkMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var results, mounts, e_5, fstab, e_6, mountsByProcesses, e_7, mountsByBoookMarks, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                results = [];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, parseMountInfo()];
            case 2:
                mounts = _a.sent();
                if (mounts.length)
                    results.push.apply(results, mounts);
                return [3 /*break*/, 4];
            case 3:
                e_5 = _a.sent();
                console.log(e_5);
                return [3 /*break*/, 4];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4 /*yield*/, parseFstab()];
            case 5:
                fstab = _a.sent();
                if (fstab.length)
                    results.push.apply(results, fstab);
                return [3 /*break*/, 7];
            case 6:
                e_6 = _a.sent();
                console.log(e_6);
                return [3 /*break*/, 7];
            case 7:
                _a.trys.push([7, 9, , 10]);
                return [4 /*yield*/, getAllSystemNetworkMounts()];
            case 8:
                mountsByProcesses = _a.sent();
                if (mountsByProcesses.length)
                    results.push.apply(results, mountsByProcesses);
                return [3 /*break*/, 10];
            case 9:
                e_7 = _a.sent();
                console.log(e_7);
                return [3 /*break*/, 10];
            case 10:
                _a.trys.push([10, 12, , 13]);
                return [4 /*yield*/, getLinuxNetworkBookmarks()];
            case 11:
                mountsByBoookMarks = _a.sent();
                if (mountsByBoookMarks.length)
                    results.push.apply(results, mountsByBoookMarks);
                return [3 /*break*/, 13];
            case 12:
                e_8 = _a.sent();
                console.log(e_8);
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/, results];
        }
    });
}); };
exports.getLinuxNetworkMounts = getLinuxNetworkMounts;
/**************
*   WINDOWS   *
***************/
// Найти network shortcuts для всех пользоватетелй
var getNetworkShortcutMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var mounts, psScriptAllUsersDynamic, psProcess, iface, _a, iface_1, iface_1_1, line, json, parsed, e_9_1;
    var _b, e_9, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                mounts = [];
                psScriptAllUsersDynamic = "\n$shell = New-Object -ComObject Shell.Application\n\n# \u0432\u0441\u0435 SID \u0438\u0437 HKEY_USERS, \u0431\u0435\u0437 \u043A\u043B\u0430\u0441\u0441\u043E\u0432\n$loadedSIDs = Get-ChildItem Registry::HKEY_USERS | Where-Object {\n    $_.Name -notmatch '_Classes$'\n}\n\nforeach ($sidKey in $loadedSIDs) {\n    $sid = $sidKey.PSChildName\n    $appDataPath = (Get-ItemProperty -Path (\"Registry::HKEY_USERS\\$sid\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders\")).AppData\n    Write-Output (\"AppDataPath for $sid $appDataPath\")\n    if (-not $appDataPath) { continue }\n\n    $networkShortcutsPath = Join-Path $appDataPath 'Roaming\\Microsoft\\Windows\\Network Shortcuts'\n    if (-not (Test-Path $networkShortcutsPath)) { \n        Write-Output \"Not found: $networkShortcutsPath\"\n        continue \n    }\n\n    $folder = $shell.NameSpace($networkShortcutsPath)\n    if ($null -eq $folder) { \n    Write-Output \"Folder COM object null for $networkShortcutsPath\"\n    continue }\n\n    foreach ($item in $folder.Items()) {\n        if ($item.IsLink) {\n            $target = $item.GetLink().Path\n            $obj = @{\n                name = $item.Name\n                path = $target\n                sid = $sid\n            }\n            $json = $obj | ConvertTo-Json -Compress -Depth 2\n            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))\n            Write-Host $b64\n        }\n    }\n}\n";
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
                    // ignore
                }
                _e.label = 4;
            case 4:
                _a = true;
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_9_1 = _e.sent();
                e_9 = { error: e_9_1 };
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
                if (e_9) throw e_9.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [2 /*return*/, Promise.resolve(mounts)];
        }
    });
}); };
var getNetworkRegistryMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var mounts, script, ps, rl, _a, rl_4, rl_4_1, line, decoded, obj, e_10_1;
                var _b, e_10, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            mounts = [];
                            script = "\n    function WriteBase64($s) { \n        Write-Host ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s)))\n    }\n\n    $userKeys = Get-ChildItem -Path Registry::HKEY_USERS\n    foreach ($key in $userKeys) { \n        \n        $sid = $key.PSChildName\n\n        $networkKeyPath = \"Registry::HKEY_USERS\\$sid\\Network\"\n\n        if (Test-Path $networkKeyPath) {\n            try {\n                $networkKey = Get-ChildItem -Path $networkKeyPath\n                } catch { Write-Error $_}\n\n            foreach ($netKey in $networkKey) {\n            \n                $values = Get-ItemProperty -Path $netKey.PSPath\n\n                $obj = @{\n                        userSid = $sid\n                        mountpoint = $netKey.PSChildName\n                        path = $values.RemotePath\n                        fstype = $values.ProviderName\n                    }\n                $json = $obj | ConvertTo-Json -Compress\n                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)\n                $base64 = [System.Convert]::ToBase64String($bytes)\n                Write-Host $base64\n            }\n        }\n    }";
                            ps = (0, child_process_1.spawn)("powershell.exe", [
                                "-NoProfile",
                                "-ExecutionPolicy", "Bypass",
                                "-Command", script
                            ], { stdio: ['ignore', 'pipe', 'inherit'] });
                            rl = (0, readline_1.createInterface)({ input: ps.stdout, crlfDelay: Infinity });
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 6, 7, 12]);
                            _a = true, rl_4 = __asyncValues(rl);
                            _e.label = 2;
                        case 2: return [4 /*yield*/, rl_4.next()];
                        case 3:
                            if (!(rl_4_1 = _e.sent(), _b = rl_4_1.done, !_b)) return [3 /*break*/, 5];
                            _d = rl_4_1.value;
                            _a = false;
                            line = _d;
                            try {
                                decoded = Buffer.from(line, 'base64').toString('utf8');
                                obj = JSON.parse(decoded);
                                mounts.push(obj);
                            }
                            catch (err) {
                                // ignore. Ошибка может возникать при запуске без прав администрирования
                            }
                            _e.label = 4;
                        case 4:
                            _a = true;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_10_1 = _e.sent();
                            e_10 = { error: e_10_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _e.trys.push([7, , 10, 11]);
                            if (!(!_a && !_b && (_c = rl_4.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _c.call(rl_4)];
                        case 8:
                            _e.sent();
                            _e.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_10) throw e_10.error;
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
    var netUseSharesConnected, netUseSharesRemembered, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)];
            case 1:
                netUseSharesConnected = (_a.sent()).map(humanize);
                return [4 /*yield*/, netEnum(netEnumScope.connected, netEnumType.disk, netEnumUsage.all)];
            case 2:
                netUseSharesRemembered = (_a.sent()).map(humanize);
                return [2 /*return*/, (__spreadArray(__spreadArray([], netUseSharesConnected.map(mapToNetworkResource), true), netUseSharesRemembered.map(mapToNetworkResource), true))];
            case 3:
                e_11 = _a.sent();
                // ignore
                return [2 /*return*/, []];
            case 4: return [2 /*return*/];
        }
    });
}); };
var getWindowsNetworkMounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var networkShortcuts, netUseMounts, registryNetworkMounts, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getNetworkShortcutMounts()];
            case 1:
                networkShortcuts = _a.sent();
                return [4 /*yield*/, getNetUseMounts()];
            case 2:
                netUseMounts = _a.sent();
                return [4 /*yield*/, getNetworkRegistryMounts()];
            case 3:
                registryNetworkMounts = _a.sent();
                result = deduplicateByMerging(__spreadArray(__spreadArray(__spreadArray([], networkShortcuts, true), netUseMounts, true), registryNetworkMounts, true));
                return [2 /*return*/, result];
        }
    });
}); };
// Вспомогательные функции 
function isNetworkFs(fstype) {
    var FsNames = Object.values(NetworkFSNames);
    return !!fstype && FsNames.includes(fstype) && FsNames.some(function (fs) { return fstype.includes(fs); });
}
function mergeObjects(a, b) {
    return {
        path: a.path || b.path,
        mountpoint: a.mountpoint || b.mountpoint,
        fstype: a.fstype || b.fstype,
        userSid: a.userSid || b.userSid,
        options: a.options || b.options,
    };
}
function deduplicateByMerging(input) {
    var map = new Map();
    for (var _i = 0, input_1 = input; _i < input_1.length; _i++) {
        var item = input_1[_i];
        var key = "".concat(item.path, "|").concat(item.userSid);
        if (!map.has(key)) {
            map.set(key, item);
        }
        else {
            var merged = mergeObjects(map.get(key), item);
            map.set(key, merged);
        }
    }
    return Array.from(map.values());
}
function keyOf(rec, val) {
    var idx = Object.values(rec).indexOf(val);
    if (idx < 0)
        return undefined;
    return Object.keys(rec)[idx];
}
function humanize(res) {
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
    return {
        path: rec.remoteName,
        mountpoint: rec.localName,
        fstype: rec.displayType,
        userSid: rec.sid,
        options: rec.comment
    };
}
// Вывод программы
getPlatformSpecificNetworkResourcesMounts()
    .then(function (mounts) {
    console.log(mounts);
})
    .catch(function (err) {
    console.error("Ошибка:", err);
});
