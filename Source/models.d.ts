﻿type Guid = string;
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



interface Identifiable {
    id: string;
}

interface FlatData extends Identifiable {
    guid?: string;
}

interface UnitData extends Identifiable {
    name: string;
    apartments: FlatData[];
}

interface BlockData extends Identifiable {
    name: string;
    units: UnitData[];
}

interface CommunityData {
    guid?: string;
    name?: string;
    buildings?: BlockData[];
}


interface UnitX extends Identifiable {
    name: string;
    items: Dict<FlatData>;
}

interface BlockX extends Identifiable {
    name: string;
    items: Dict<UnitX>;
}

interface CommunityX {
    guid?: string;
    name?: string;
    items?: Dict<BlockX>;
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
    rooms?: Guid[];
    deleteRooms?: string[];
    newNric?: string;
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

interface CommunityDetail {
    id: Guid;
    name?: string;
    area?: number;
    remark?: string;
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