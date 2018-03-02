var Seq = /** @class */ (function () {
    function Seq(iter, state) {
        this._iter = iter;
        this._state = state;
    }
    Seq.prototype.map = function (method) {
        var _this = this;
        var combo = function (cont) { return _this._state(function (x) { return cont(method(x)); }); };
        return new Seq(this._iter, combo);
    };
    Seq.prototype.filter = function (predicate) {
        var _this = this;
        var combo = function (cont) {
            return _this._state(function (x) {
                if (predicate(x))
                    cont(x);
            });
        };
        return new Seq(this._iter, combo);
    };
    Seq.prototype.toDict = function (keySelector) {
        var dict = Dict.zero(keySelector);
        this._iter(this._state(dict.tryAdd.bind(dict)));
        console.log(dict);
        return dict;
    };
    Seq.prototype.toArray = function () {
        var arr = [];
        var cont = function (x) { return arr.push(x); };
        this._iter(this._state(cont));
        return arr;
    };
    Seq.prototype.forEach = function (method) {
        this._iter(this._state(method));
    };
    Seq.prototype.reduce = function (reduction) {
        var r = undefined;
        var cont = function (x) { r = r === undefined ? x : reduction(r, x); };
        this._iter(this._state(cont));
        return r;
    };
    Seq.prototype.fold = function (state, folder) {
        var r = state;
        var cont = function (x) { r = folder(r, x); };
        this._iter(this._state(cont));
        return r;
    };
    Seq.ofArray = function (arr) {
        return new Seq(arr.forEach.bind(arr), function (f) { return f; });
    };
    Seq.create = function (iter) {
        return new Seq(iter, function (f) { return f; });
    };
    return Seq;
}());
//function DeferArray(arr, calc) {
//    this.filter = function (predicate) {
//        function combo(cont) {
//            return calc(function (x) {
//                if (predicate(x)) {
//                    cont(x);
//                }
//            });
//        }
//        return new DeferArray(arr, combo);
//    }
//    this.map = function (maper) {
//        function combo(cont) {
//            return calc(function (x) {
//                cont(maper(x));
//            })
//        }
//        return new DeferArray(arr, combo);
//    }
//    this.toArray = function () {
//        var ret = [];
//        function cont(x) {
//            ret.push(x);
//        }
//        arr.forEach(calc(cont));
//        return ret;
//    }
//}
//Array.prototype.delay = function () {
//    function calc(cont) {
//        return cont.bind(this);
//    }
//    return new DeferArray(this, calc);
//}
//# sourceMappingURL=Seq.js.map