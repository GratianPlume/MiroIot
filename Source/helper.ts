interface Option<T> {
    data: (cont: Reducing<T>) => {
        none: (f: () => void) => void
    }
}

type Key = string | number;

class MainView {
    chooseCommunity: CommunityDetail | {} = {};
    personnel: Dict<Person>;
    address: CommunityData = {};
    devices: Dict<Device>;
    cards: Card[] = [];
    Fingerprints: Fingerprint[] = [];
    AdvertisingPlans: Adplan[] = [];
    AdFiles: Adfile[] = [];
    AdchooseCom: CommunityDetail | {} = {};
    ADunAuthDevice: Dict<Device>;
    queryAddress: CommunityData = {};
}

class AdminView {
    name = "";
    communities: CommunityDetail[] = [];
    manager = Dict.zero<AdminData>(x => x.openid);
    level: number;
    Advertising: Adfile[] = [];
}

class TimeConvert {
    static getTimestamp(timeStr: string): number {
        const newTimeStr = timeStr.replace(/:/g, "-").replace(/[/]/g, "-").replace(/ /g, "-").split("-").map(Number);
        console.log(`${timeStr}:${newTimeStr}`);
        const result = new Date(Date.UTC(newTimeStr[0], newTimeStr[1] - 1, newTimeStr[2], newTimeStr[3] - 8, newTimeStr[4], newTimeStr[5]));
        return Math.floor(result.getTime() / 1000);
    }
}
class Vadicate {

    static blockId(id: string): boolean {
        if (id.length !== 4) {
            alert("楼号必须是4位数字，例如：0001");
            return false;
        }
        if (isNaN(Number(id))) {
            alert("楼号必须是4位数字，例如：0001");
            return false;
        }
        return true;
    }

    static unitId(id: string): boolean {
        if (id.length !== 2) {
            alert("单元号必须是2位数字，例如：01");
            return false;
        }
        if (isNaN(Number(id))) {
            alert("单元号必须是2位数字，例如：01");
            return false;
        }
        return true;
    }

    static flatId(start: string, end: string): boolean {
        if (start.length !== 2 || end.length !== 2) {
            alert("房间或者楼层号必须是两位数字，例如：01");
            return false;
        }
        if (isNaN(Number(start)) || isNaN(Number(end))) {
            alert("房间或者楼层号必须是两位数字，例如：01");
            return false;
        }
        if (Number(start) > Number(end)) {
            alert("开始房间或者楼号大于结束房间或者楼号！");
            return false;
        }
        return true;
    }
}

/** 键选择器 */
interface KeySelector<TValue> {
    (value: TValue): string | number;
}

/** 字典核心 */
interface DictCore<T> {
    [key: string]: T;
    [key: number]: T;
}

interface ReadOnlyDictCore<T> {
    readonly [key: string]: T;
    readonly [key: number]: T;
}

class Dict<TValue> {
    private _length: number;
    private readonly _item: DictCore<TValue>;
    private readonly _keySelector: KeySelector<TValue>;

    private constructor(keySelector: KeySelector<TValue>, item = {}, length = 0) {
        this._keySelector = keySelector;
        this._length = length;
        this._item = item;
    }

    get length() {
        return this._length;
    }

    /**
     * 返回只读字典
     * @returns {} 
     */
    get $(): ReadOnlyDictCore<TValue> {
        return this._item;
    }
    /**
     * 返回一个反序的对象
     * @returns {} 
     */
    get $$() {
        interface Reducing {
            (x: DictCore<TValue>): DictCore<TValue>
        }
        interface Transducer {
            (cont: Reducing): Reducing
        }
        const combo = (state: Transducer, key: Key, value: TValue): Transducer => {
            const f0 = Dict.setter(key, value);
            return f1 => state(x => f0(f1(x)));
        };
        let counter: (cont: Reducing) => Reducing = angular.identity;
        const item = this._item;
        for (const key in item) {
            if (item.hasOwnProperty(key))
                counter = combo(counter, key, item[key]);
        }
        return counter(angular.identity)({});
    }
    containKey(key: Key) {
        return this._item[key] !== undefined;
    }
    /**
     * 返回一个绑定键值的函数：该函数把键值输入参数字典中,并返回字典
     * @param key
     * @param value
     */
    private static setter<TValue>(key: Key, value: TValue) {
        return (x: DictCore<TValue>) => {
            x[key] = value;
            return x;
        };
    }

    addOrUpdate(value: TValue) {
        const key = this._keySelector(value);
        if (this._item[key] === undefined) {
            this._length++;
        }
        this._item[key] = value;
    }

    tryAdd(value: TValue): boolean {
        const key = this._keySelector(value);
        if (this._item[key] !== undefined)
            return false;
        else {
            this._item[key] = value;
            this._length++;
            return true;
        }
    }
    tryAddHead(values: TValue[]): TValue[] {
        const item = this._item;
        const reduces: Array<[number | string, TValue]> = [];
        const unhandled: TValue[] = [];
        for (const val of values) {
            const key = this._keySelector(val);
            if (item[key] === undefined) {
                reduces.push([key, val]);
            } else {
                unhandled.push(val);
            }
        }
        interface Reducing {
            (x: DictCore<TValue>): DictCore<TValue>
        }
        interface Transducer {
            (cont: Reducing): Reducing
        }
        const combo = (key: Key, value: TValue, state: Transducer): Transducer => {
            const f0 = Dict.setter(key, value);
            return f1 => state(x => f1(f0(x)));
        };
        const trans = (cont: Reducing) => {
            let state: Transducer = angular.identity;
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    const value = item[key];
                    delete item[key];
                    state = combo(key, value, state);
                }
            }
            return state(cont);
        };
        const counter = trans(angular.identity);

        for (const [key, val] of reduces) {
            item[key] = val;
        }
        counter(item);
        this._length += reduces.length;
        return unhandled;
    }
    tryRemove(value: TValue): boolean {
        const key = this._keySelector(value);
        if (this._item[key] !== undefined) {
            delete this._item[key];
            this._length--;
            return true;
        }
        return false;
    }
    tryRemoveKey(key: string | number): TValue {
        const item = this._item[key];
        if (item !== undefined) {
            delete this._item[key];
            this._length--;
            return item;
        }
        return undefined;
    }
    get first() {
        const item = this._item;
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                return item[key];
            }
        }
        return undefined;
    }
    toArray(): TValue[];
    toArray<T>(mapping: (source: TValue) => T): T[];
    toArray<T>(mapping?: (source: TValue) => T): Array<T | TValue> {
        const item = this._item;
        if (mapping) {
            const x: T[] = [];
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    x.push(mapping(this._item[key]));
                }
            }
            return x;
        } else {
            const x: TValue[] = [];
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    x.push(this._item[key]);
                }
            }
            return x;
        }
    }
    toSortedArray(sortKeySelector: KeySelector<TValue>): TValue[];
    toSortedArray<T>(sortKeySelector: KeySelector<T>, mapping: (source: TValue) => T): T[];
    toSortedArray<T>(sortKeySelector: KeySelector<T>, mapping?: (source: TValue) => T): Array<T | TValue> {
        return this.toArray(mapping).sort(Helper.comparefn(sortKeySelector));
    }
    some(predicate: (value: TValue) => boolean) {
        const item = this._item;
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const value = this._item[key];
                if (predicate(value)) {
                    return true;
                }
            }
        }
        return false;
    }
    filter(predicate: (value: TValue) => boolean) {
        const x = {};
        const item = this._item;
        let length = 0;
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const value = this._item[key];
                if (predicate(value)) {
                    x[key] = value;
                    length++;
                }
            }
        }
        return new Dict<TValue>(this._keySelector, x, length);
    }
    /**
     * 用浅克隆获取一个新的字典
     * @returns {} 
     */
    get copy() {
        const x = {};
        const item = this._item;
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const value = this._item[key];
                x[key] = value;
            }
        }
        return new Dict<TValue>(this._keySelector, x, this.length);
    }
    /**
     * 创建一个空的字典
     * @param keySelector 键选择器
     */
    static zero<T>(keySelector: KeySelector<T>) {
        return new Dict<T>(keySelector);
    }
    static ofArray<T>(keySelector: KeySelector<T>, arr: T[]): Dict<T>;
    static ofArray<T, R>(keySelector: KeySelector<T>, arr: T[], mapping: (source: T) => R): Dict<R>;
    static ofArray<T, R>(keySelector: KeySelector<T>, arr: T[], mapping?: (source: T) => R): Dict<T | R> {
        const src = arr || [];
        return new Dict<T | R>(keySelector, Dict.arrToDicc(keySelector, src, mapping), src.length);
    }
    static orderByArray<T>(keySelector: KeySelector<T>, arr: T[], sortKeySelector: KeySelector<T>): Dict<T>;
    static orderByArray<T, R>(keySelector: KeySelector<T>, arr: T[], sortKeySelector: KeySelector<T>, mapping: (source: T) => R): Dict<R>;
    static orderByArray<T, R>(keySelector: KeySelector<T>, arr: T[], sortKeySelector: KeySelector<T>, mapping?: (source: T) => R): Dict<T | R> {
        const sortedArr = arr.sort((a, b) => {
            const av = sortKeySelector(a);
            const bv = sortKeySelector(b);
            return av > bv ? 1 : (av === bv ? 0 : -1);
        });
        return new Dict<T | R>(keySelector, Dict.arrToDicc(keySelector, sortedArr, mapping), arr.length);
    }
    /**
     * 把数组转换为字典
     * @param keySelector 键选择器
     * @param arr 数组
     */
    static arrToDicc<T>(keySelector: KeySelector<T>, arr: T[]): DictCore<T>;
    static arrToDicc<T, R>(keySelector: KeySelector<T>, arr: T[], mapping: (source: T) => R): DictCore<R>;
    static arrToDicc<T, R>(keySelector: KeySelector<T>, arr: T[], mapping?: (source: T) => R): DictCore<T | R> {
        const x = {};
        if (mapping) {
            for (const item of arr) {
                x[keySelector(item)] = mapping(item);
            }
            return x;
        } else {
            for (const item of arr) {
                x[keySelector(item)] = item;
            }
            return x;
        }
    }
}

class Helper {
    /**
     * 数组转换为字典管理器，以元素的id为键。
     * @param arr 要转换的数组
     */
    static arrToDic<T extends Identifiable>(arr: T[]): Dict<T>;
    static arrToDic<T extends Identifiable, R>(arr: T[], mapping: (source: T) => R): Dict<R>;
    static arrToDic<T extends Identifiable, R>(arr: T[], mapping?: (source: T) => R): Dict<T | R> {
        return Dict.ofArray<T, R>(x => x.id, arr, mapping);
    }

    /**
     * 把设备码从数字转换为7位字符串
     * @param value
     */
    static deviceAddressToStr(value: number) {
        if (value !== undefined) {
            const doorStr = `000000${value}`;
            return doorStr.slice(-7);
        }
        return "";
    }

    static deviceToView(source: Device): DeviceView {
        return {
            id: source.id,
            address: Helper.deviceAddressToStr(source.address),
            password: source.password,
            communityId: source.communityId,
            remark: source.remark
        };
    }

    static fingerConstans: ReadonlyArray<FingerConstans> = [
        { id: 1, name: "左手拇指" },
        { id: 2, name: "左手食指" },
        { id: 3, name: "左手中指" },
        { id: 4, name: "左手无名指" },
        { id: 5, name: "左手小指" },
        { id: 6, name: "右手拇指" },
        { id: 7, name: "右手食指" },
        { id: 8, name: "右手中指" },
        { id: 9, name: "右手无名指" },
        { id: 10, name: "右手小指" }];

    static statusConstans: ReadonlyArray<StatusConstans> = [
        { id: undefined, name: "全部" },
        { id: 0, name: "关闭" },
        { id: 1, name: "打开" },
        { id: 2, name: "离线" },
        { id: 3, name: "网络恢复" },
        { id: 4, name: "软件上线" }];

    static weekConstans: ReadonlyArray<string> = ["日", "一", "二", "三", "四", "五", "六"];

    static adminConstans: ReadonlyArray<AdminConstans> = [
        { id: 1, name: "一级管理员" },
        { id: 2, name: "二级管理员" },
        { id: 3, name: "三级管理员" }];

    static eventConstans: ReadonlyArray<EventConstans> = [
        { id: undefined, name: "全部" },
        { id: 0, name: "指纹开锁" },
        { id: 1, name: "呼叫" },
        { id: 2, name: "QQ开锁" },
        { id: 3, name: "IC卡开锁" },
        { id: 4, name: "监视" },
        { id: 5, name: "人脸识别" }];

    static toTreeItem(data: CommunityData): TreeItem[] {
        return [{
            text: data.name,
            id: "0",
            guid: data.guid,
            nodes: data.buildings.map(block => <BlockItem>{
                text: block.id + "--" + block.name,
                id: "1",
                blockNumber: block.id,
                blockName: block.name,
                nodes: block.units.map(unit => <UnitItem>{
                    text: unit.id + "--" + unit.name,
                    id: "2",
                    blockNumber: block.id,
                    unitNumber: unit.id,
                    unitName: unit.name,
                    nodes: unit.apartments.map((flat: FlatData) => <FlatItem>{
                        text: flat.id,
                        blockNumber: block.id,
                        unitNumber: unit.id,
                        roomNumber: flat.id,
                        id: "3",
                        guid: flat.guid
                    })
                })
            })
        }];
    }
    /**
     * 生成一个迭代器
     * @param permits 指纹或者门禁卡数组
     * @param devices 设备数组
     */
    static permitGenerator(permits: Guid[], devices: Guid[]) {
        let deviceIdx = 0; // 门口机
        let permitIdx = 0; // 印信
        return (result: boolean, next: (dIdx: number, sIdx: number) => void): void => {
            if (result) {
                if (permitIdx < permits.length) {
                    return next(deviceIdx, permitIdx++);
                }
                if (++deviceIdx < devices.length) {
                    permitIdx = 0;
                    return next(deviceIdx, permitIdx++);
                }
            } else if (++deviceIdx < devices.length) {
                permitIdx = 0;
                return next(deviceIdx, permitIdx++);
            }
        };

    }

    static getSeq(elements: JQuery<HTMLElement>) {
        const iter = (cont: (x: HTMLInputElement) => void) => angular.forEach(elements, cont);
        return Seq.create(iter);
    }

    static val<T>(val: T): Option<T> {
        return {
            data: cont => {
                cont(val);
                return { none: angular.noop };
            }
        };
    }

    static none<T>(): Option<T> {
        return { data: () => ({ none: f => f() }) };
    }

    /**
     * 权限的并集
     * @param secrets 指纹或者门禁卡数组
     */
    static unionAuths(secrets: Authorizable[]): Dict<Auth> {
        if (!secrets || secrets.length === 0) {
            return Dict.zero<Auth>(x => x.deviceId);
        }
        const dicts = Dict.ofArray<Auth>(x => x.deviceId, secrets[0].auth);
        for (let j = 1; j < secrets.length; j++) {
            const device = secrets[j];
            for (let i = 0; i < device.auth.length; i++) {
                dicts.tryAdd(device.auth[i]);
            }
        }
        return dicts;
    }
    /**
     * 权限的交集的补集
     * @param secrets 指纹或者门禁卡数组
     * @param devices
     */
    static complementOfIntersect(secrets: Authorizable[], devices: Dict<Device>): Dict<Device> {
        if (!secrets || secrets.length === 0) {
            return devices.copy;
        }
        const dicts = secrets.map(x => Dict.arrToDicc<Auth>(t => t.deviceId, x.auth));
        const cache = dicts[0];
        for (const key in cache) {
            if (cache.hasOwnProperty(key)) {
                for (let i = 1; i < secrets.length; i++) {
                    if (!dicts[i][key]) {
                        delete cache[key];
                        continue;
                    }
                }
            }
        }
        return devices.filter(t => !cache[t.id]);
    }
    static findInArray<T>(arr: T[], predicate: (x: T) => boolean) {
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (predicate(item))
                return item;
        }
        return undefined;
    }
    /**
     * 把两个已排序数组合并为一个排序数组，相同数据被合并。
     * @param arr1
     * @param arr2
     * @param defIdx 合并相同数据时选用的数据，0 表示来自第一个数组，1表示来自第二个数组。
     * @param comparator 比较器
     */
    static sortedMerge<T>(arr1: T[], arr2: T[], defIdx: 0 | 1, comparator: (a: T, b: T) => number) {
        let idx1 = 0;
        let idx2 = 0;
        const result: T[] = [];
        const reduce = (idx: number, arr: T[]) => {
            for (let i = idx; i < arr.length; i++) {
                result.push(arr[i]);
            }
            return result;
        };
        while (true) {
            if (arr1.length === idx1)
                return reduce(idx2, arr2);

            if (arr2.length === idx2) {
                return reduce(idx1, arr1);
            }

            const cur1 = arr1[idx1];
            const cur2 = arr2[idx2];
            const compare = comparator(cur1, cur2);
            if (compare > 0) {
                result.push(cur2);
                idx2++;
                continue;
            }
            if (compare < 0) {
                result.push(cur1);
                idx1++;
                continue;
            }
            const cur = defIdx ? cur2 : cur1;
            result.push(cur);
            idx1++;
            idx2++;
        }
    }
    static comparefn<T>(sortKeySelector: KeySelector<T>) {
        return (a, b) => {
            const av = sortKeySelector(a);
            const bv = sortKeySelector(b);
            return av > bv ? 1 : (av === bv ? 0 : -1);
        };
    }
}
