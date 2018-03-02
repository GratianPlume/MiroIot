var MainView = (function () {
    function MainView() {
        this.chooseCommunity = {};
        this.address = {};
        this.cards = [];
        this.Fingerprints = [];
        this.AdvertisingPlans = [];
        this.AdFiles = [];
        this.AdchooseCom = {};
        this.queryAddress = {};
    }
    return MainView;
}());
var AdminView = (function () {
    function AdminView() {
        this.name = "";
        this.communities = [];
        this.manager = Dict.zero(function (x) { return x.openid; });
        this.Advertising = [];
    }
    return AdminView;
}());
var TimeConvert = (function () {
    function TimeConvert() {
    }
    TimeConvert.prototype.getTimestamp = function (timeStr) {
        var newTimeStr = timeStr.replace(/:/g, "-").replace(/[/]/g, "-").replace(/ /g, "-").split("-").map(parseInt);
        var result = new Date(Date.UTC(newTimeStr[0], newTimeStr[1] - 1, newTimeStr[2], newTimeStr[3] - 8, newTimeStr[4], newTimeStr[5]));
        return Math.floor(result.getTime() / 1000);
    };
    return TimeConvert;
}());
var Vadicate = (function () {
    function Vadicate() {
    }
    Vadicate.blockId = function (id) {
        if (id.length !== 4) {
            alert("楼号必须是4位数字，例如：0001");
            return false;
        }
        if (isNaN(Number(id))) {
            alert("楼号必须是4位数字，例如：0001");
            return false;
        }
        return true;
    };
    Vadicate.unitId = function (id) {
        if (id.length !== 2) {
            alert("单元号必须是2位数字，例如：01");
            return false;
        }
        if (isNaN(Number(id))) {
            alert("单元号必须是2位数字，例如：01");
            return false;
        }
        return true;
    };
    Vadicate.flatId = function (start, end) {
        if (start.length !== 2 || end.length !== 2) {
            alert("房间或者楼层号必须是两位数字，例如：01");
            return false;
        }
        if (isNaN(Number(start)) || isNaN(Number(end))) {
            alert("房间或者楼层号必须是两位数字，例如：01");
            return false;
        }
        if (Number(start) > Number(end)) {
            alert("开始房间或者楼号大于结束房间或者楼号！");
            return false;
        }
        return true;
    };
    return Vadicate;
}());
var Dict = (function () {
    function Dict(keySelector, item, length) {
        if (item === void 0) { item = {}; }
        if (length === void 0) { length = 0; }
        this._keySelector = keySelector;
        this._length = length;
        this._item = item;
    }
    Object.defineProperty(Dict.prototype, "length", {
        get: function () {
            return this._length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dict.prototype, "$", {
        get: function () {
            return this._item;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dict.prototype, "$$", {
        get: function () {
            var combo = function (state, key, value) {
                var f0 = Dict.setter(key, value);
                return function (f1) { return state(function (x) { return f0(f1(x)); }); };
            };
            var counter = angular.identity;
            var item = this._item;
            for (var key in item) {
                if (item.hasOwnProperty(key))
                    counter = combo(counter, key, item[key]);
            }
            return counter(angular.identity)({});
        },
        enumerable: true,
        configurable: true
    });
    Dict.prototype.containKey = function (key) {
        return this._item[key] !== undefined;
    };
    Dict.setter = function (key, value) {
        return function (x) {
            x[key] = value;
            return x;
        };
    };
    Dict.prototype.addOrUpdate = function (value) {
        var key = this._keySelector(value);
        if (this._item[key] === undefined) {
            this._length++;
        }
        this._item[key] = value;
    };
    Dict.prototype.tryAdd = function (value) {
        var key = this._keySelector(value);
        if (this._item[key] !== undefined)
            return false;
        else {
            this._item[key] = value;
            this._length++;
            return true;
        }
    };
    Dict.prototype.tryAddHead = function (values) {
        var item = this._item;
        var reduces = [];
        var unhandled = [];
        for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
            var val = values_1[_i];
            var key = this._keySelector(val);
            if (item[key] === undefined) {
                reduces.push([key, val]);
            }
            else {
                unhandled.push(val);
            }
        }
        var combo = function (key, value, state) {
            var f0 = Dict.setter(key, value);
            return function (f1) { return state(function (x) { return f1(f0(x)); }); };
        };
        var trans = function (cont) {
            var state = angular.identity;
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    var value = item[key];
                    delete item[key];
                    state = combo(key, value, state);
                }
            }
            return state(cont);
        };
        var counter = trans(angular.identity);
        for (var _a = 0, reduces_1 = reduces; _a < reduces_1.length; _a++) {
            var _b = reduces_1[_a], key = _b[0], val = _b[1];
            item[key] = val;
        }
        counter(item);
        this._length += reduces.length;
        return unhandled;
    };
    Dict.prototype.tryRemove = function (value) {
        var key = this._keySelector(value);
        if (this._item[key] !== undefined) {
            delete this._item[key];
            this._length--;
            return true;
        }
        return false;
    };
    Dict.prototype.tryRemoveKey = function (key) {
        var item = this._item[key];
        if (item !== undefined) {
            delete this._item[key];
            this._length--;
            return item;
        }
        return undefined;
    };
    Object.defineProperty(Dict.prototype, "first", {
        get: function () {
            var item = this._item;
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    return item[key];
                }
            }
            return undefined;
        },
        enumerable: true,
        configurable: true
    });
    Dict.prototype.toArray = function (mapping) {
        var item = this._item;
        if (mapping) {
            var x = [];
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    x.push(mapping(this._item[key]));
                }
            }
            return x;
        }
        else {
            var x = [];
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    x.push(this._item[key]);
                }
            }
            return x;
        }
    };
    Dict.prototype.some = function (predicate) {
        var item = this._item;
        for (var key in item) {
            if (item.hasOwnProperty(key)) {
                var value = this._item[key];
                if (predicate(value)) {
                    return true;
                }
            }
        }
        return false;
    };
    Dict.prototype.filter = function (predicate) {
        var x = {};
        var item = this._item;
        var length = 0;
        for (var key in item) {
            if (item.hasOwnProperty(key)) {
                var value = this._item[key];
                if (predicate(value)) {
                    x[key] = value;
                    length++;
                }
            }
        }
        return new Dict(this._keySelector, x, length);
    };
    Object.defineProperty(Dict.prototype, "copy", {
        get: function () {
            var x = {};
            var item = this._item;
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    var value = this._item[key];
                    x[key] = value;
                }
            }
            return new Dict(this._keySelector, x, this.length);
        },
        enumerable: true,
        configurable: true
    });
    Dict.zero = function (keySelector) {
        return new Dict(keySelector);
    };
    Dict.ofArray = function (keySelector, arr, mapping) {
        return new Dict(keySelector, Dict.arrToDicc(keySelector, arr, mapping), arr.length);
    };
    Dict.orderByArray = function (keySelector, arr, sortKeySelector, mapping) {
        var sortedArr = arr.sort(function (a, b) {
            var av = sortKeySelector(a);
            var bv = sortKeySelector(b);
            return av > bv ? 1 : (av === bv ? 0 : -1);
        });
        return new Dict(keySelector, Dict.arrToDicc(keySelector, sortedArr, mapping), arr.length);
    };
    Dict.arrToDicc = function (keySelector, arr, mapping) {
        var x = {};
        if (mapping) {
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var item = arr_1[_i];
                x[keySelector(item)] = mapping(item);
            }
            return x;
        }
        else {
            for (var _a = 0, arr_2 = arr; _a < arr_2.length; _a++) {
                var item = arr_2[_a];
                x[keySelector(item)] = item;
            }
            return x;
        }
    };
    return Dict;
}());
var Helper = (function () {
    function Helper() {
    }
    Helper.arrToDic = function (arr, mapping) {
        return Dict.ofArray(function (x) { return x.id; }, arr, mapping);
    };
    Helper.deviceAddressToStr = function (value) {
        if (value !== undefined) {
            var doorStr = "000000" + value;
            return doorStr.slice(-7);
        }
        return "";
    };
    Helper.deviceToView = function (source) {
        return {
            id: source.id,
            address: Helper.deviceAddressToStr(source.address),
            password: source.password,
            communityId: source.communityId,
            remark: source.remark
        };
    };
    Helper.toTreeItem = function (data) {
        return [{
                text: data.name,
                id: "0",
                guid: data.guid,
                nodes: data.items.toArray(function (block) { return ({
                    text: block.id + "--" + block.name,
                    id: "1",
                    blockNumber: block.id,
                    blockName: block.name,
                    nodes: block.items.toArray(function (unit) { return ({
                        text: unit.id + "--" + unit.name,
                        id: "2",
                        blockNumber: block.id,
                        unitNumber: unit.id,
                        unitName: unit.name,
                        nodes: unit.items.toArray(function (flat) { return ({
                            text: flat.id,
                            blockNumber: block.id,
                            unitNumber: unit.id,
                            roomNumber: flat.id,
                            id: "3",
                            guid: flat.guid
                        }); })
                    }); })
                }); })
            }];
    };
    Helper.permitGenerator = function (permits, devices) {
        var deviceIdx = 0;
        var permitIdx = 0;
        return function (result, next) {
            if (result) {
                if (permitIdx < permits.length) {
                    return next(deviceIdx, permitIdx++);
                }
                if (++deviceIdx < devices.length) {
                    permitIdx = 0;
                    return next(deviceIdx, permitIdx++);
                }
            }
            else if (++deviceIdx < devices.length) {
                permitIdx = 0;
                return next(deviceIdx, permitIdx++);
            }
        };
    };
    Helper.getSeq = function (elements) {
        var iter = function (cont) { return angular.forEach(elements, cont); };
        return Seq.create(iter);
    };
    Helper.val = function (val) {
        return {
            data: function (cont) {
                cont(val);
                return { none: angular.noop };
            }
        };
    };
    Helper.none = function () {
        return { data: function () { return ({ none: function (f) { return f(); } }); } };
    };
    Helper.unionAuths = function (secrets) {
        if (!secrets || secrets.length === 0) {
            return Dict.zero(function (x) { return x.deviceId; });
        }
        var dicts = Dict.ofArray(function (x) { return x.deviceId; }, secrets[0].auth);
        for (var j = 1; j < secrets.length; j++) {
            var device = secrets[j];
            for (var i = 0; i < device.auth.length; i++) {
                dicts.tryAdd(device.auth[i]);
            }
        }
        return dicts;
    };
    Helper.complementOfIntersect = function (secrets, devices) {
        if (!secrets || secrets.length === 0) {
            return devices.copy;
        }
        var dicts = secrets.map(function (x) { return Dict.arrToDicc(function (t) { return t.deviceId; }, x.auth); });
        var cache = dicts[0];
        for (var key in cache) {
            if (cache.hasOwnProperty(key)) {
                for (var i = 1; i < secrets.length; i++) {
                    if (!dicts[i][key]) {
                        delete cache[key];
                        continue;
                    }
                }
            }
        }
        return devices.filter(function (t) { return !cache[t.id]; });
    };
    Helper.findInArray = function (arr, predicate) {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (predicate(item))
                return item;
        }
        return undefined;
    };
    Helper.sortedMerge = function (arr1, arr2, defIdx, comparator) {
        var idx1 = 0;
        var idx2 = 0;
        var result = [];
        var reduce = function (idx, arr) {
            for (var i = idx; i < arr.length; i++) {
                result.push(arr[i]);
            }
            return result;
        };
        while (true) {
            if (arr1.length === idx1)
                return reduce(idx2, arr2);
            if (arr2.length === idx2) {
                return reduce(idx1, arr1);
            }
            var cur1 = arr1[idx1];
            var cur2 = arr2[idx2];
            var compare = comparator(cur1, cur2);
            if (compare > 0) {
                result.push(cur2);
                idx2++;
                continue;
            }
            if (compare < 0) {
                result.push(cur1);
                idx1++;
                continue;
            }
            var cur = defIdx ? cur2 : cur1;
            result.push(cur);
            idx1++;
            idx2++;
        }
    };
    Helper.fingerConstans = [
        { id: 1, name: "左手拇指" },
        { id: 2, name: "左手食指" },
        { id: 3, name: "左手中指" },
        { id: 4, name: "左手无名指" },
        { id: 5, name: "左手小指" },
        { id: 6, name: "右手拇指" },
        { id: 7, name: "右手食指" },
        { id: 8, name: "右手中指" },
        { id: 9, name: "右手无名指" },
        { id: 10, name: "右手小指" }
    ];
    Helper.statusConstans = [
        { id: undefined, name: "全部" },
        { id: 0, name: "关闭" },
        { id: 1, name: "打开" },
        { id: 2, name: "离线" },
        { id: 3, name: "网络恢复" },
        { id: 4, name: "软件上线" }
    ];
    Helper.weekConstans = ["日", "一", "二", "三", "四", "五", "六"];
    Helper.adminConstans = [
        { id: 1, name: "一级管理员" },
        { id: 2, name: "二级管理员" },
        { id: 3, name: "三级管理员" }
    ];
    Helper.eventConstans = [
        { id: undefined, name: "全部" },
        { id: 0, name: "指纹开锁" },
        { id: 1, name: "呼叫" },
        { id: 2, name: "QQ开锁" },
        { id: 3, name: "IC卡开锁" },
        { id: 3, name: "监视" }
    ];
    return Helper;
}());
//# sourceMappingURL=helper.js.map