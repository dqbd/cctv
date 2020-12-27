"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _path = _interopRequireDefault(require("path"));
var _promiseMysql = _interopRequireDefault(require("promise-mysql"));
var _segment = require("./segment");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class Database {
    getScenesTable(cameraKey) {
        return `${cameraKey}_SCENES`;
    }
    getMotionTable(cameraKey) {
        return `${cameraKey}_MOTION`;
    }
    init() {
        return _asyncToGenerator((function*() {
            if (!this.conn) {
                this.conn = yield _promiseMysql.default.createConnection(this.config);
            }
        }).bind(this))();
    }
    close() {
        return _asyncToGenerator((function*() {
            if (this.conn) {
                this.conn.end();
            }
        }).bind(this))();
    }
    createTable(cameraKey) {
        return _asyncToGenerator((function*() {
            var ref, ref1;
            yield this.init();
            if (this.hasCreated[cameraKey]) return;
            yield (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n      CREATE TABLE IF NOT EXISTS ?? (\n        timestamp BIGINT NOT NULL,\n        path varchar(180) NOT NULL,\n        PRIMARY KEY (timestamp)\n      )\n      ENGINE = MyISAM\n    `, [
                this.getScenesTable(cameraKey)
            ]);
            yield (ref1 = this.conn) === null || ref1 === void 0 ? void 0 : ref1.query(`\n      CREATE TABLE IF NOT EXISTS ?? (\n        timestamp BIGINT NOT NULL,\n        scene NUMERIC(12, 10) NOT NULL,\n        PRIMARY KEY (timestamp)\n      )\n      ENGINE = MyISAM\n    `, [
                this.getMotionTable(cameraKey)
            ]);
            this.hasCreated[cameraKey] = true;
        }).bind(this))();
    }
    resetFolder(cameraKey) {
        return _asyncToGenerator((function*() {
            var ref, ref1;
            yield this.createTable(cameraKey);
            return Promise.all([
                (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query("TRUNCATE TABLE ??", [
                    this.getScenesTable(cameraKey)
                ]),
                (ref1 = this.conn) === null || ref1 === void 0 ? void 0 : ref1.query("TRUNCATE TABLE ??", [
                    this.getMotionTable(cameraKey)
                ]), 
            ]);
        }).bind(this))();
    }
    insertFolder(cameraKey, keyBase, filenames, len = 3 * 24 * 3600) {
        return _asyncToGenerator((function*() {
            yield this.createTable(cameraKey);
            console.log("Insert", cameraKey, keyBase, filenames.length);
            let i = 0, n = filenames.length;
            while(i < n){
                var ref;
                const slices = filenames.slice(i, i += len);
                const queries = slices.reduce((memo, filename)=>{
                    const segment = _segment.createSegment(filename);
                    const target = _path.default.join(keyBase, _path.default.basename(filename));
                    if (!segment) return memo;
                    memo.push([
                        segment.timestamp,
                        target
                    ]);
                    return memo;
                }, []);
                yield (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`INSERT INTO ?? (timestamp, path) VALUES ? ON DUPLICATE KEY UPDATE path = path`, [
                    this.getScenesTable(cameraKey),
                    queries
                ]);
            }
        }).bind(this))();
    }
    insert(cameraKey, relative) {
        return _asyncToGenerator((function*() {
            var ref;
            console.log("Insert", cameraKey, relative);
            yield this.createTable(cameraKey);
            const segment = _segment.createSegment(_path.default.basename(relative));
            if (!segment || segment.duration <= 0) return null;
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n      INSERT INTO ?? (path, timestamp)\n      VALUES (?, ?)\n      ON DUPLICATE KEY UPDATE path = ?\n    `, [
                this.getScenesTable(cameraKey),
                relative,
                segment.timestamp,
                relative
            ]);
        }).bind(this))();
    }
    seek(cameraKey, from, to, limit = 5) {
        return _asyncToGenerator((function*() {
            var ref;
            yield this.createTable(cameraKey);
            if (!to) {
                var ref1;
                return (ref1 = this.conn) === null || ref1 === void 0 ? void 0 : ref1.query(`\n          SELECT * FROM ??\n          WHERE timestamp >= ?\n          ORDER BY timestamp ASC\n        `, [
                    this.getScenesTable(cameraKey),
                    from
                ]);
            }
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n        SELECT * FROM ??\n        WHERE timestamp >= ? AND timestamp <= ?\n        ORDER BY timestamp ASC\n      `, [
                this.getScenesTable(cameraKey),
                from,
                to
            ]);
        }).bind(this))();
    }
    seekFrom(cameraKey, from, limit = 5) {
        return _asyncToGenerator((function*() {
            var ref;
            yield this.createTable(cameraKey);
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n        SELECT * FROM ??\n        WHERE timestamp >= ?\n        ORDER BY timestamp ASC\n        LIMIT ?\n      `, [
                this.getScenesTable(cameraKey),
                from,
                limit
            ]);
        }).bind(this))();
    }
    shift(cameraKey, shift = 0, limit = 5) {
        return _asyncToGenerator((function*() {
            var ref;
            yield this.createTable(cameraKey);
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n        SELECT * FROM ??\n        WHERE timestamp >= ?\n        ORDER BY timestamp ASC\n        LIMIT ?\n      `, [
                this.getScenesTable(cameraKey),
                Math.floor(Date.now() / 1000) - shift,
                limit, 
            ]);
        }).bind(this))();
    }
    removeOldScenesAndMotion(cameraKey, maxAge) {
        return _asyncToGenerator((function*() {
            var ref, ref1;
            yield this.createTable(cameraKey);
            const timestamp = Math.floor(Date.now() / 1000) - maxAge;
            return Promise.all([
                (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n          DELETE FROM ??\n          WHERE timestamp <= ?\n        `, [
                    this.getScenesTable(cameraKey),
                    timestamp
                ]),
                (ref1 = this.conn) === null || ref1 === void 0 ? void 0 : ref1.query(`\n          DELETE FROM ??\n          WHERE timestamp <= ?\n        `, [
                    this.getMotionTable(cameraKey),
                    timestamp
                ]), 
            ]);
        }).bind(this))();
    }
    getScenes(cameraKey) {
        return _asyncToGenerator((function*() {
            var ref;
            yield this.createTable(cameraKey);
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n        SELECT * FROM ??\n        ORDER BY timestamp DESC\n      `, [
                this.getMotionTable(cameraKey)
            ]);
        }).bind(this))();
    }
    addScene(cameraKey, value) {
        return _asyncToGenerator((function*() {
            var ref;
            yield this.createTable(cameraKey);
            return (ref = this.conn) === null || ref === void 0 ? void 0 : ref.query(`\n          INSERT INTO ?? (timestamp, scene)\n          VALUES (?, ?)\n      `, [
                this.getMotionTable(cameraKey),
                Date.now(),
                value
            ]);
        }).bind(this))();
    }
    constructor(config){
        this.config = config;
        this.conn = null;
        this.hasCreated = {
        };
    }
}
exports.Database = Database;
