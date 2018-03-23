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
        /** 民族*/
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
    assister = new WebSocket("ws://localhost:5018/");
    onerror: (this: WebSocket, ev: Event) => void;
    onclose: (this: WebSocket, ev: CloseEvent) => void;
    onreset: () => void;
    onopen: () => void;
    onImage: (index: number, image: string) => void;
    onsuccess: () => void;
    onfail: (err: number) => void;
    onNricRoc: (data: NricInfo) => void;
    constructor() {
        this.assister.onerror = this.onerror;
        this.assister.onclose = this.onclose;
        this.assister.onopen = () => this.reset();
        this.assister.onmessage = event => {
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
            } else if (FpService.isNricRoc(imgObj)) {
                this.onNricRoc(imgObj.data);
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
        this.onreset();
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
