var Seq = (function () {
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
//# sourceMappingURL=Seq.js.map