interface Command {
    command: string;
    datatype: string;
    msgid: string;
}

interface Capture extends Command {
    index: number;
    data: {
        image: string;
        width: number;
        height: number;
    };
}

interface Merge extends Command {
    errcode: number;
    data?: {
        feature: string;
    }
}

interface MergeImage {
    feature: string;
    image: string;
    width: number;
    height: number;
}

class FpService {
    private _captures: Capture[];
    private _merge: Merge;
    fingerSocket = new WebSocket("ws://localhost:5018/");
    onerror: (this: WebSocket, ev: Event) => void;
    onclose: (this: WebSocket, ev: CloseEvent) => void;
    onreset: () => void;
    onopen: () => void;
    onImage: (index: number, image: string) => void;
    onsuccess: () => void;
    onfail: (err: number) => void;
    constructor() {
        this.fingerSocket.onerror = this.onerror;
        this.fingerSocket.onclose = this.onclose;
        this.fingerSocket.onopen = () => this.reset();
        this.fingerSocket.onmessage = event => {
            const imgObj: Command = JSON.parse(event.data);
            if (this._merge) {
                console.log("请按重新采集");
                return;
            }
            if (FpService.isCapture(imgObj)) {
                this._captures.push(imgObj);
                this.onImage(imgObj.index, `data:image/png;base64,${imgObj.data.image}`);
            } else if (FpService.isMerge(imgObj)) {
                if (!imgObj.errcode) {
                    this._merge = imgObj;
                    this.onsuccess();
                } else {
                    this.reset();
                    this.onfail(imgObj.errcode);
                }
            }
        }
    }

    get item(): MergeImage {
        if (!this._merge)
            return undefined;
        else return {
            feature: this._merge.data.feature,
            image: this._captures[0].data.image,
            width: this._captures[0].data.width,
            height: this._captures[0].data.height,
        }
    }

    reset() {
        this.fingerSocket.send(JSON.stringify({
            command: "reset"
        }));
        this._captures = [];
        this._merge = undefined;
        this.onreset();
    }
    close() {
        this.fingerSocket.close();
    }
    static isCapture(msg: Command): msg is Capture {
        return msg.datatype === "fpcapture";
    }

    static isMerge(msg: Command): msg is Merge {
        return msg.datatype === "fpmerge";
    }
    static create() {
        return new FpService();
    }
}








