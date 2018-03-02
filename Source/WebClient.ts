class WebClient {
    private readonly _ws: WebSocket;
    private _wsId: string;
    private _rsaKey: RsaKeyPair;
    onopen: () => void;
    onclose: () => void;
    onerror: () => void;
    onClearEvents: () => void;
    onEvent: (item: EventItem) => void;
    onLog: (item: LogItem) => void;
    onEventsCompleted: () => void;
    onClearLogs: () => void;
    onLogsCompleted: () => void;

    get id(): string {
        return this._wsId;
    }

    get rsaKey(): RsaKeyPair {
        return this._rsaKey;
    }

    bindOpen(onopen: () => void) {
        this.onopen = onopen;
        return this;
    }

    bindClose(onclose: () => void) {
        this.onclose = onclose;
        return this;
    }

    bindError(onerror: () => void) {
        this.onerror = onerror;
        return this;
    }

    bindClearEvents(onClearEvents: () => void) {
        this.onClearEvents = onClearEvents;
        return this;
    }

    bindEvent(onEvent: (item: EventItem) => void) {
        this.onEvent = onEvent;
        return this;
    }

    bindEventsCompleted(onEventsCompleted) {
        this.onEventsCompleted = onEventsCompleted;
        return this;
    }

    bindClearLogs(onClearLogs: () => void) {
        this.onClearLogs = onClearLogs;
        return this;
    }

    bindLog(onLog: (item: LogItem) => void) {
        this.onLog = onLog;
        return this;
    }

    bindLogsCompleted(onLogsCompleted: () => void) {
        this.onLogsCompleted = onLogsCompleted;
        return this;
    }


    private constructor(ws: WebSocket) {
        this._ws = ws;
        const timeout = 10000;
        const keepAlive = () => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    command: "keepAlive"
                }));
                setTimeout(keepAlive, timeout);
            }
        };
        ws.onopen = () => {
            this.onopen();
            ws.send(JSON.stringify({
                command: "getRsaKey"
            }));
            setTimeout(keepAlive, timeout);
        };
        ws.onclose = this.onclose;
        ws.onerror = this.onerror;
        ws.onmessage = msg => {
            const json: WsCommand = JSON.parse(msg.data);
            switch (json.command) {
                case "echoRsaKey":
                    const rsaKey = json.data;
                    this._wsId = json.wsHash;
                    this._rsaKey = new RsaKeyPair(rsaKey.RsaE, "", rsaKey.RsaM);
                    break;
                case "clearEvents":
                    this.onClearEvents();
                    break;
                case "eventsComplete":
                    this.onEventsCompleted();
                    break;
                case "clearLogs":
                    this.onClearLogs();
                    break;
                case "logsComplete":
                    this.onLogsCompleted();
                    break;
                case "eventItem":
                    this.onEvent(json);
                    break;
                case "logItem":
                    this.onLog(json);
                    break;
            }
        };

    }
    static connect(): WebClient {
        if ("WebSocket" in window) {
            setMaxDigits(131);
            const url = `ws://${location.host}/ws/web`;
            const ws = new WebSocket(url);
            return new WebClient(ws);
        } else {
            throw ("浏览器不支持WebSocket");
        }
    }
}
