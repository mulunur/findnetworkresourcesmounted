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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = require("fs");
var os = require("os");
var path = require("path");
function getNetworkResourcesMounts() {
    var platform = os.platform();
    if (platform === "linux") {
        return getLinuxNetworkMounts();
    }
    else if (platform === "win32") {
        return getWindowsNetworkMounts();
    }
    else {
        return Promise.reject("\u041E\u0421 ".concat(platform, " \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F."));
    }
}
function getLinuxNetworkMounts() {
    var _this = this;
    var paths = ["/proc/self/mountinfo", "/etc/mtab"];
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var _i, paths_1, path_1, data, mounts, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, paths_1 = paths;
                    _a.label = 1;
                case 1:
                    if (!(_i < paths_1.length)) return [3 /*break*/, 6];
                    path_1 = paths_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fs.promises.readFile(path_1, "utf8")];
                case 3:
                    data = _a.sent();
                    mounts = data
                        .split("\n")
                        .map(function (line) { return line.split(" "); })
                        .filter(function (parts) { return parts.length > 8 && (parts[8] === "cifs" || parts[8] === "nfs"); })
                        .map(function (parts) { return ({
                        device: parts[2],
                        mountpoint: parts[4],
                        fstype: parts[8],
                        options: parts[9]
                    }); });
                    resolve(mounts);
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    console.error("Ошибка чтения /proc/self/mountinfo:", err_1);
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
function getWindowsNetworkMounts() {
    var shortcutSuffix = path.join("AppData", "Roaming", "Microsoft", "Windows", "Network Shortcuts");
    var usersRoot = "C:\\Users";
    var users = fs.readdirSync(usersRoot, { withFileTypes: true })
        .filter(function (entry) { return entry.isDirectory(); })
        .map(function (entry) { return entry.name; });
    return new Promise(function (resolve, reject) {
        var mounts = [];
        for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
            var user = users_1[_i];
            var shortcutPath = path.join(usersRoot, user, shortcutSuffix);
            if (fs.existsSync(shortcutPath)) {
                var files = fs.readdirSync(shortcutPath);
                for (var _a = 0, files_1 = files; _a < files_1.length; _a++) {
                    var file = files_1[_a];
                    mounts.push({
                        device: path.join(shortcutPath, file),
                        mountpoint: "",
                        fstype: "cifs",
                        options: ""
                    });
                }
            }
        }
        (0, child_process_1.exec)("net use", { encoding: "utf8" }, function (error, stdout, stderr) {
            if (error) {
                reject(error);
                return;
            }
            var lines = stdout.split("\n")
                .map(function (line) { return line.trim(); })
                .filter(function (line) { return line && !line.startsWith("Status") && !line.startsWith("---") && !line.includes("The command completed"); });
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                var parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    var status_1 = parts[0], local = parts[1], remote = parts[2];
                    mounts.push({
                        device: remote,
                        mountpoint: local,
                        fstype: "cifs",
                        options: status_1
                    });
                }
            }
            resolve(mounts);
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
