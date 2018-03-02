var FpService = /** @class */ (function () {
    function FpService() {
        var _this = this;
        this.fingerSocket = new WebSocket("ws://localhost:5018/");
        this.fingerSocket.onerror = this.onerror;
        this.fingerSocket.onclose = this.onclose;
        this.fingerSocket.onopen = function () { return _this.reset(); };
        this.fingerSocket.onmessage = function (event) {
            var imgObj = JSON.parse(event.data);
            if (_this._merge) {
                console.log("请按重新采集");
                return;
            }
            if (FpService.isCapture(imgObj)) {
                _this._captures.push(imgObj);
                _this.onImage(imgObj.index, "data:image/png;base64," + imgObj.data.image);
            }
            else if (FpService.isMerge(imgObj)) {
                if (!imgObj.errcode) {
                    _this._merge = imgObj;
                    _this.onsuccess();
                }
                else {
                    _this.reset();
                    _this.onfail(imgObj.errcode);
                }
            }
        };
    }
    Object.defineProperty(FpService.prototype, "item", {
        get: function () {
            if (!this._merge)
                return undefined;
            else
                return {
                    feature: this._merge.data.feature,
                    image: this._captures[0].data.image,
                    width: this._captures[0].data.width,
                    height: this._captures[0].data.height,
                };
        },
        enumerable: true,
        configurable: true
    });
    FpService.prototype.reset = function () {
        this.fingerSocket.send(JSON.stringify({
            command: "reset"
        }));
        this._captures = [];
        this._merge = undefined;
        this.onreset();
    };
    FpService.prototype.close = function () {
        this.fingerSocket.close();
    };
    FpService.isCapture = function (msg) {
        return msg.datatype === "fpcapture";
    };
    FpService.isMerge = function (msg) {
        return msg.datatype === "fpmerge";
    };
    FpService.create = function () {
        return new FpService();
    };
    return FpService;
}());
//# sourceMappingURL=Fingerprint.js.map