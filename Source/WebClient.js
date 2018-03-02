var WebClient = (function () {
    function WebClient(ws) {
        var _this = this;
        this._ws = ws;
        var timeout = 10000;
        var keepAlive = function () {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    command: "keepAlive"
                }));
                setTimeout(keepAlive, timeout);
            }
        };
        ws.onopen = function () {
            _this.onopen();
            ws.send(JSON.stringify({
                command: "getRsaKey"
            }));
            setTimeout(keepAlive, timeout);
        };
        ws.onclose = this.onclose;
        ws.onerror = this.onerror;
        ws.onmessage = function (msg) {
            var json = JSON.parse(msg.data);
            switch (json.command) {
                case "echoRsaKey":
                    var rsaKey = json.data;
                    _this._wsId = json.wsHash;
                    _this._rsaKey = new RsaKeyPair(rsaKey.RsaE, "", rsaKey.RsaM);
                    break;
                case "clearEvents":
                    _this.onClearEvents();
                    break;
                case "eventsComplete":
                    _this.onEventsCompleted();
                    break;
                case "clearLogs":
                    _this.onClearLogs();
                    break;
                case "logsComplete":
                    _this.onLogsCompleted();
                    break;
                case "eventItem":
                    _this.onEvent(json);
                    break;
                case "logItem":
                    _this.onLog(json);
                    break;
            }
        };
    }
    Object.defineProperty(WebClient.prototype, "id", {
        get: function () {
            return this._wsId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebClient.prototype, "rsaKey", {
        get: function () {
            return this._rsaKey;
        },
        enumerable: true,
        configurable: true
    });
    WebClient.prototype.bindOpen = function (onopen) {
        this.onopen = onopen;
        return this;
    };
    WebClient.prototype.bindClose = function (onclose) {
        this.onclose = onclose;
        return this;
    };
    WebClient.prototype.bindError = function (onerror) {
        this.onerror = onerror;
        return this;
    };
    WebClient.prototype.bindClearEvents = function (onClearEvents) {
        this.onClearEvents = onClearEvents;
        return this;
    };
    WebClient.prototype.bindEvent = function (onEvent) {
        this.onEvent = onEvent;
        return this;
    };
    WebClient.prototype.bindEventsCompleted = function (onEventsCompleted) {
        this.onEventsCompleted = onEventsCompleted;
        return this;
    };
    WebClient.prototype.bindClearLogs = function (onClearLogs) {
        this.onClearLogs = onClearLogs;
        return this;
    };
    WebClient.prototype.bindLog = function (onLog) {
        this.onLog = onLog;
        return this;
    };
    WebClient.prototype.bindLogsCompleted = function (onLogsCompleted) {
        this.onLogsCompleted = onLogsCompleted;
        return this;
    };
    WebClient.connect = function () {
        if ("WebSocket" in window) {
            setMaxDigits(131);
            var url = "ws://" + location.host + "/ws/web";
            var ws = new WebSocket(url);
            return new WebClient(ws);
        }
        else {
            throw ("浏览器不支持WebSocket");
        }
    };
    return WebClient;
}());
//# sourceMappingURL=webClient.js.map