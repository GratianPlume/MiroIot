interface Command {
    command: "ack_upload";
    datatype: "fpcapture" | "fpmerge" | "nricRoc";
    msgid: string;
}

interface Capture extends Command {
    datatype: "fpcapture";
    index: number;
    data: {
        image: string;
        width: number;
        height: number;
    };
}

interface Merge extends Command {
    datatype: "fpmerge";
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

interface NricInfo {
    baseInfo: {
        name: string;
        sex: 1 | 2;
        /** 民族 */
        ethnic: number;
        birthDay: string;
        address: string;
        /** 身份证号码 */
        id: string;
        authorizer: string;
        termStart: string;
        termEnd: string;
    };
    attachText: string;
    picture: string;
}

interface NricRoc extends Command {
    datatype: "nricRoc";
    msgid: string;
    data: NricInfo;
}

class FpService {
    private _captures: Capture[];
    private _merge: Merge;
    assister: WebSocket;
    private _onerror: (this: WebSocket, ev: Event) => void;
    private _onclose: (this: WebSocket, ev: CloseEvent) => void;
    private _onreset: () => void;
    private _onopen: () => void;
    private _onImage: (index: number, image: string) => void;
    private _onsuccess: () => void;
    private _onfail: (err: number) => void;
    private _onNricRoc: (data: NricInfo) => void;

    onerror(fn) {
        this._onerror = fn;
        return this;
    }
    onclose(fn) {
        this._onclose = fn;
        return this;
    }
    onreset(fn) {
        this._onreset = fn;
        return this;
    }
    onImage(fn) {
        this._onImage = fn;
        return this;
    }
    onsuccess(fn) {
        this._onsuccess = fn;
        return this;
    }
    onfail(fn) {
        this._onfail = fn;
        return this;
    }
    onNricRoc(fn: (data: NricInfo) => void) {
        this._onNricRoc = fn;
        return this;
    }
    onopen(fn) {
        this._onopen = fn;
        return this;
    }
    start(url: string) {
        this.assister = new WebSocket(url);
        this.assister.onerror = this._onerror;
        this.assister.onclose = this._onclose;
        this.assister.onopen = this._onopen;
        this.assister.onmessage = event => {
            const imgObj: Command = JSON.parse(event.data);
            if (this._merge) {
                console.log("请按重新采集");
                return;
            }
            if (FpService.isCapture(imgObj)) {
                this._captures.push(imgObj);
                this._onImage(imgObj.index, `data:image/png;base64,${imgObj.data.image}`);
            } else if (FpService.isMerge(imgObj)) {
                if (!imgObj.errcode) {
                    this._merge = imgObj;
                    this._onsuccess();
                } else {
                    this.reset();
                    this._onfail(imgObj.errcode);
                }
            } else if (FpService.isNricRoc(imgObj)) {
                this._onNricRoc(imgObj.data);
            }
        };
    }
    

    get item(): MergeImage {
        if (!this._merge)
            return undefined;
        else return {
            feature: this._merge.data.feature,
            image: this._captures[0].data.image,
            width: this._captures[0].data.width,
            height: this._captures[0].data.height,
        };
    }

    reset() {
        this.assister.send(JSON.stringify({
            command: "reset"
        }));
        this._captures = [];
        this._merge = undefined;
        this._onreset();
    }
    close() {
        this.assister.close();
    }
    static isCapture(msg: Command): msg is Capture {
        return msg.datatype === "fpcapture";
    }

    static isMerge(msg: Command): msg is Merge {
        return msg.datatype === "fpmerge";
    }

    static isNricRoc(msg: Command): msg is NricRoc {
        return msg.datatype === "nricRoc";
    }

    static create() {
        return new FpService();
    }
}
