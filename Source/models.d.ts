type Guid = string;
type Nric = string;

interface RsaKey {
    command: "echoRsaKey";
    wsHash: string;
    data: { RsaE: string; RsaM: string };
}

interface ClearEvents {
    command: "clearEvents";
}

interface EventsCompleted {
    command: "eventsComplete";
}

interface ClearLogs {
    command: "clearLogs";
}

interface LogsCompleted {
    command: "logsComplete";
}

interface EventItem {
    command: "eventItem";
    eventType: number;
    nric: string;
    address: number;
    id: string;
    name: string;
    timestamp: number;
    qq: string;
}

interface LogItem {
    command: "logItem";
    id: string;
    address: number;
    timestamp: number;
    status: number;
}

type WsCommand = RsaKey | ClearEvents | EventsCompleted | ClearLogs | LogsCompleted | EventItem | LogItem;



interface Identifiable<T extends (string | number)> {
    id: T;
}

interface FlatData extends Identifiable<string> {
    guid?: string;
}

interface UnitData extends Identifiable<string> {
    name: string;
    apartments: FlatData[];
}

interface BlockData extends Identifiable<string> {
    name: string;
    units: UnitData[];
}

interface CommunityData {
    guid?: string;
    name?: string;
    buildings?: BlockData[];
}


interface UnitX extends Identifiable<string> {
    name: string;
    items: Dict<FlatData>;
}

interface BlockX extends Identifiable<string> {
    name: string;
    items: Dict<UnitX>;
}

interface CommunityX {
    guid?: string;
    name?: string;
    items?: Dict<BlockX>;
}

interface RoomBinding {
    id: Guid,
    /** 是否居住*/
    living?: Boolean,
    /** 与户主关系*/
    relative?: Relative,
    /** 开始租住时间*/
    rentalStart?: number,
    /** 终止租住时间*/
    rentalEnd?: number,
    /** 人户一致*/
    uniform?: Boolean,
}

interface Person {
    name: string;
    phone: string;
    nric: Nric;
    // ReSharper disable once InconsistentNaming
    QQ: string;
    wechat: string;
    remark: string;
    occupation: string;
    phoneMac: string;
    rooms?: RoomBinding[];
    deleteRooms?: string[];
    newNric?: string;
    /** 居民类型*/ 
    kind?: 1 | 2;
    /** 性别*/ 
    sex?: 1 | 2;
    /** 签发机关*/
    author?: string;
    /** 身份证地址*/ 
    address?: string;
    /** 民族*/ 
    nation?: string;
    /** 出生日期*/
    birthDay?: number;
    /** 证件有效期开始时间*/
    validFrom?: number;
    /** 证件有效期结束*/
    validTo?: number;
    /** 永久有效*/
    permanent?: boolean;
    /** 头像*/
    head?: string;
    /** 头像类别*/
    headType?: "png" | "jpg";
    /** 户籍流动性*/
    fluidity?: 1 | 2;
    /** 户籍省份*/
    province?: string;
    /** 户籍市*/
    city?: string;
    /** 户籍区/县*/
    district?: string;
    /** 户籍地址*/
    domicile?: string;
    /** 户籍号*/
    regCode?: string;
    pcaCode?: number;
}



interface CommunityPerson {
    id: Guid;
    nric: Nric;
}

interface Device {
    id?: Guid;
    address?: number;
    password: string;
    communityId?: string;
    remark: string;
}

interface DeviceStatus {
    address: number;
    isOpened: boolean;
    remark: string;
    isOnline: boolean;
}

interface Auth {
    deviceId: Guid;
    expire?: number;
    binding?: string;
}

interface Authorizable {
    auth?: Auth[];
}

interface Result {
    result: boolean;
    errorCode?: number;
    message?: string;
}

interface ReasonResults {
    result: boolean;
    errors?: {
        code: string;
        description: string;
    }[];
}

interface IssueResult extends Result {
    device: Guid;
}

interface Adissue {
    deviceId: Guid;
    planId: Guid;
}

interface Card extends Authorizable {
    id?: Guid;
    serial: string;
    communityId: string;
    nric?: Nric;
}

interface Fingerprint extends Authorizable {
    id?: Guid;
    feature?: string;
    image?: string;
    communityId?: string;
    nric?: string;
    finger?: number;
    width?: number;
    height?: number;
}

interface FingerBinder {
    communityId: string;
    id?: string;
}

interface CommunityDetail extends Identifiable<Guid> {
    id: Guid;
    name?: string;
    area?: number;
    remark?: string;
    url?:string;
}

interface AdminData {
    communities?: CommunityDetail[];
    name?: string;
    openid: string;
    level: number;
    remark: string;
}

interface PureAdplan {
    startTime: number;
    endTime: number;
    weekDays: number[];
    loop: boolean;
}

interface Adplan {
    id: Guid;
    fileId: Guid;
    fileTitle: string;
    term: number;
    remark: string;
    plans: PureAdplan[];
}

interface Adfile {
    id?: Guid;
    title: string;
    remark: string;
    dataType?: number;
    file?: File;
    creator?: string;
    uploadTime?: number;
    communities: Guid[];
}

interface Adsolid {
    id?: Guid;
    fileId: Guid;
    fileTitle?: string;
    term?: number;
    remark: string;
    plans: PureAdplan[];
}

interface QueryEvents {
    beginTime: number;
    endTime: number;
    gate?: string;
    community?: string;
    event: number;
    nric: string;
    name: string;
    phone: string;
    address?: string;
}

interface QueryLogs {
    beginTime: number;
    endTime: number;
    deviceId: Guid;
    communityId: Guid;
    status: number;
}