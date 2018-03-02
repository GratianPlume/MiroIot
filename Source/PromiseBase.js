var PromiseBase = (function () {
    function PromiseBase(resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
    }
    PromiseBase.prototype.isPromiseLike = function (value) {
        return !!(value.then);
    };
    PromiseBase.prototype.tryPromiseLike = function (promise, result) {
        result.then(function (value) {
            if (promise._resolve) {
                promise._resolve(value);
            }
        });
    };
    PromiseBase.prototype.continue = function (result, resolve) {
        if (this.isPromiseLike(result)) {
            result.then(function (x) {
                if (resolve)
                    resolve(x);
            });
        }
        else if (resolve) {
            resolve(result);
        }
    };
    PromiseBase.prototype.then = function (onfulfilled, onrejected) {
        var _this = this;
        var promise = new PromiseBase();
        if (onfulfilled) {
            this._resolve = function (value) {
                var result = onfulfilled(value);
                _this.continue(result, promise._resolve);
            };
        }
        if (onrejected) {
            this._reject = function (reason) {
                var result = onrejected(reason);
                _this.continue(result, promise._resolve);
            };
        }
        return promise;
    };
    PromiseBase.prototype.catch = function (onrejected) {
        var _this = this;
        var promise = new PromiseBase();
        this._reject = function (reason) {
            if (onrejected) {
                var result = onrejected(reason);
                _this.continue(result, promise._resolve);
            }
        };
        return promise;
    };
    return PromiseBase;
}());
//# sourceMappingURL=PromiseBase.js.map