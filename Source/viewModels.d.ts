﻿/// <reference path="./models.d.ts"/>
/// <reference path="./node_modules/@types/angular/index.d.ts"/>

interface StConstans {
    readonly id: number;
    readonly name: string;
}

type FingerConstans = StConstans;

type StatusConstans = StConstans;

type AdminConstans = StConstans;

type EventConstans = StConstans;

interface RootScope extends ng.IRootScopeService {
    $apply(): any;
    $apply(exp: string): any;
    $apply(exp: (scope: ng.IScope) => any): any;
    $on(name: string, listener: (event: ng.IAngularEvent, ...args: any[]) => any): () => void;
    isAuthorize: boolean;
    currentCommunity: boolean;
    recordBarData: boolean;
    listQuery: boolean;
    logsbarData: boolean;
    listStatus: boolean;
    openAdsystem: boolean;
    events: EventItem[];
    Status: LogItem[];
}

interface Scope extends angular.IScope {
    asideView: boolean;
    addTree: boolean;
    hideGuardSystem: boolean;
    hideAdSystem: boolean;
    hideAdFileManage: boolean;
    hideAdLaunch: boolean;
    showOperateCom: boolean;
    Login_register: boolean;
    chooseAdPower_1: boolean;
    chooseAdPower_2: boolean;
    authList: boolean;
    editing: boolean;
    addAddressview: boolean;
    alertSuccess: boolean;
    alertFail: boolean;
    chooseBinding: boolean;
    alreadyBinding: boolean;
    addCardNumberValidate: boolean;
    addcardPersonnelsValidate: boolean;
    addCardcomplete: boolean;
    showSpeedyAddCard: boolean;
    speedyAddCardInfo: boolean;
    cardEdit_show: boolean;
    editCardcomplete: boolean;
    alreadyTime: boolean;
    chooseFingersInfoHide: boolean;
    websocketIsready: boolean;
    openMore: boolean;
    tobe_editCardSerial: string;
    GradeValue: string;
    newCommunityName: string;
    newCommunityRemark: string;
    editedAdmin: string;
    choosedeviceGuid: string;
    newDevicepwd: string;
    newRemark: string;
    addName: string;
    addNumber: string;
    addQQ: string;
    addWeChat: string;
    addRemark: string;
    addWorkUnit: string;
    addphoneMac: string;
    chooseBackColor: string;
    moreQuery: string;
    comName: string;
    StatusId: number;
    chooseNumber: number;
    selectedAdView: number;
    selectedView: number;
    adminViewList: { name: string; control: number }[];
    FingerConstans: ReadonlyArray<FingerConstans>;
    choosePersonEdit: Person;
    alreadyAuth: Dict<Auth>;
    editCard_address: AddressView;
    bindingRoom: BindingRoom[];
    editName: string;
    editQQ: string;
    editPhone: string;
    editOccupation: string;
    editWechat: string;
    editPhoneMac: string;
    editRemark: string;
    choosePersonEditID: string;
    event: number;
    Imgbase: string;
    StatusIds: ReadonlyArray<StatusConstans>;
    selectedFingerprint: Fingerprint[];
    authCompleteinfo: {
        device: string;
        success: string[];
        fail: string[];
        message?: string;
    }[];
    selectedCard: Card[];
    editedAdminCommunities: Dict<CommunityDetail>;
    uneditedAdminCommunities: Dict<CommunityDetail>;
    ChooseauthDevice: Dict<Device>;
    unalreadyAuthFingerprint: Dict<Device>;
    card_viewData: Card[];
    fingerprint_viewData: Fingerprint[];
    addAddressListView: { name: string; guid: string }[];
    addAddressList: string[];
    choosePersonEditRooms: string[];
    cardPersonnels: Dict<Person>;
    speedyAddCardSuccessList: string[];
    tobe_editCardList: Card[];
    alreadyAuthFingerprint: Dict<Auth>;
    authADCompleteinfo: IssueResult[];
    ChooseauthDevice_AD: Dict<Device>;
    alreadyAuth_AD: Dict<Device>;
    cardPersonnel: { x?: string };
    whoFile: Adfile;
    adminData: AdminView;
    searchData: {
        GateList: DeviceView[];
        Gate?: string;
    }
    eventlist: ReadonlyArray<EventConstans>;
    userGradeList: AdminConstans[];
    ComStrViewSwitch: {
        mode?: "0" | "1" | "2" | "3";
        buildingID?: string;
        buildingName?: string;
        unitID?: string;
        unitName?: string;
        editbuildingID?: string;
        editbuildingName?: string;
        editunitID?: string;
        editunitName?: string;
        editroomID?: string;
    };
    viewSwitch: {
        mode: number;
    }
    closeaddTree(): void;
    drawTree(): void;
    SendArch(com: CommunityDetail): void;
    /**当前小区的数据 */
    communityData: MainView;
    addBuilding(id: string, name: string): void;
    editBuilding(id: string, name: string): void;
    deleteBuilding(): void;
    addunit(id: string, name: string): void;
    editunit(id: string, name: string): void;
    deleteunit(): void;
    addroom(roomidstart: string, roomidend: string, storeyidstart: string, storeyidend: string);
    editroom(id: string): void;
    deleteroom(): void;
    SubmitComTree(): void;
    chooseAdPowerView(num: string): void;
    chooseUrl(num: 1 | 2): void;
    chooseView(num: number): void;
    switchView(num: number): void;
    Urlstyle(num: number): string;
    entrancesidebarStyle(num: number): string;
    querysidebarStyle(num: number): string;
    advertisingsidebarStyle(num: number): string;
    accountUrl(num: number): string;
    login(user: string, password: string, remember: boolean): void;
    changeLogin(): void;
    registerActive(user: string, password: string, inviteCode: string): void;
    functionalView(): void;
    getAdminList(): void;
    openEditCommunity(community: CommunityDetail): void;
    editCommunity(name: string, remark: string): void;
    deleteCommunity(): void;
    createNewCommunity(area: number, name: string, remark: string): void;
    deleteAdmin(): void;
    editAdmin(manager, index: number): void;
    authCommunity(): void;
    unAuthCommunity(): void;
    showList(): void;
    generateInviteCode(remark: string): void;
    changepwd(oldPwd: string, newPwd: string): void;
    chooseDevice(device: Device): void;
    chooseDeviceStyle(device: Device): string;
    addAddress(building: BlockData, unit: UnitData, room: FlatData): void;
    deleteAddAddress(id: string): void;
    queryPersonnerl(id: string): void;
    refreshAddAddressList(): void;
    addPersonnel(addName: string, addId: string, addNumber: string, addWorkUnit: string, addQQ: string, addWeChat: string, addphoneMac: string, addRemark: string): void;
    choosePersonnel(person): void;
    chooseStyle(person): string;
    deletePersonnel(): void;
    editAddAddress(building: BlockData, unit: UnitData, room: FlatData): void;
    editDeleteAddAddress(id: string): void;
    editPerson(choosePersonEditId: string, editName: string, editQQ: string, editPhone: string, editOccupation: string, editWechat: string, editPhoneMac: string, editRemark: string): void;
    personPredicate(val: Person): boolean;
    addDevice(addressBuilding: BlockData, addressUnit: UnitData, deviceNumber: string, devicePwd: string, deviceRemark: string): void;
    deleteDevice(): void;
    editDevicepwd(newDevicepwd: string, newRemark: string): void;
    selectAuthDevice(): void;
    roomPersonnel(id?: FlatData): void;
    openAddCard(): void;
    switchAddCard(): void;
    addCard_speedy(event: KeyboardEvent, cardNumber: string): void;
    addCard(cardNumber: string, cardPersonnel: string): void;
    chooseCard(index: string, event: MouseEvent, card: Card): void;
    selectAllCard(): void;
    selectAllCard_not(): void;
    selectBinding(): void;
    selectCard_Edit(): void;
    editCard(nric: Nric): void;
    deleteCard(): void;
    validityTimeDefault(): void;
    authCardToDevice(): void;
    deleteAuthCard(): void;
    cardFilter(str: string): void;
    chooseFingerConstans(finger: string): void;
    getUserFingerprints(user: string): void;
    chooseFinger(finger: StConstans): string;
    openAddFinger(): void;
    resetFinger(): void;
    closeAddFinger(): void;
    addFinger(finger: string, user: string): void;
    chooseFingerprint(index: string, event: MouseEvent, fingerprint: Fingerprint): void;
    selectAllFingerprint(): void;
    selectAllfingerprint_not(): void;
    deletefingerprint(): void;
    authFingerprintToDevice(): void;
    deleteAuthfingerprint(): void;
    fingerprintFilter(str: string): void;
    chooseadvertisingView(num: number): void;
    functionaladvertisingView(): void;
    getAdminAdvertisingFile(): void;
    upAdvertisingFile(): void;
    open_EditFile(file: Adfile): void;
    editFile(): void;
    getComPlans(com: string): void;
    getcomAdFile(com: string): void;
    addPlayTimeForm(): void;
    secondsTotime(secondStr: string): string;
    weekDayToStr(weekday: string): string;
    addPlaybackPlan(): void;
    deletePlaybackPlan(): void;
    choosePlan(plan: Adplan): void;
    choosePlanStyle(item: Adplan): string;
    authAdPlayToDevice(): void;
    deleteAuth_AD(): void;
    openMoreChange(): void;
    chooseQueryView(num: number): void;
    functionalQueryView(): void;
    initTime(): void;
    getGate(comId: string): void;
    QueryRecord(com: string, gate: string, event: number, name: string, nric: string, phone: string, addressBuilding: BlockData, addressUnit: UnitData, addressRoom: FlatData): void;
    detail(id: string, eventType: string): void;
    QueryStatus(com: string, gate: string, statusid: number): void;
    enlargeImg(): void;
    restoreImg(): void;
}

interface DeviceView {
    id?: Guid;
    address: string;
    password?: string;
    communityId?: string;
    remark?: string;

}

interface AddressView {
    building?: BlockX;
    unit?: UnitX;
    room?: FlatData;
    nric?: string;
}

interface Filter extends angular.IFilterService {
    (name: "roomName"): (guid: Guid, data: CommunityX) => string;
    (name: "roomToAddressid"): (guid: Guid, data: CommunityX) => string;
    (name: "nricTorooms"): (id: string, people: Dict<Person>) => string[];
    (name: "nricToname"): (id: string, people: Dict<Person>) => string;
    (name: "fingerFilter"): (finger: number) => string;
    (name: "orderBy"): angular.IFilterOrderBy;

}

interface FlatItem {
    readonly id: "3";
    text: string;
    blockNumber: string;
    unitNumber: string;
    roomNumber: string;
    guid: string;
}

interface UnitItem {
    readonly id: "2";
    text: string;
    blockNumber: string;
    unitNumber: string;
    unitName: string;
    nodes: FlatItem[];
}

interface BlockItem {
    readonly id: "1";
    text: string;
    blockNumber: string;
    blockName: string;
    nodes: UnitItem[];
}

interface TreeItem {
    readonly id: "0";
    text: string;
    guid: string;
    nodes: BlockItem[];
}

type NodeItem = TreeItem | BlockItem | UnitItem | FlatItem;

interface BindingRoom {
    room: string;
    id: string;
}