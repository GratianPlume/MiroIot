interface Reducing<T> {
    (x: T): void
}
interface Transducer<T> {
    (cont: Reducing<T>): Reducing<any>
}

class Seq<T> {
    private readonly _iter: (callbackfn: Reducing<any>) => void;
    private readonly _state: Transducer<T>;
    private constructor(iter: (callbackfn: Reducing<any>) => void, state: Transducer<T>) {
        this._iter = iter;
        this._state = state;
    }
    map<R>(method: (x: T) => R) {
        const combo: Transducer<R> = cont => this._state(x => cont(method(x)));
        return new Seq<R>(this._iter, combo);
    }
    filter(predicate: (x: T) => boolean) {
        const combo: Transducer<T> = cont => {
            return this._state(x => {
                if (predicate(x))
                    cont(x);
            });
        };
        return new Seq<T>(this._iter, combo);
    }
    toDict(keySelector: KeySelector<T>) {
        const dict = Dict.zero<T>();
        const cont: (x: T) => void = x => dict.tryAdd(keySelector(x), x);
        this._iter(this._state(cont));
        console.log(dict);
        return dict;
    }
    toArray() {
        const arr: T[] = [];
        const cont: (x: T) => void = x => arr.push(x);
        this._iter(this._state(cont));
        return arr;
    }
    forEach(method: (x: T) => void) {
        this._iter(this._state(method));
    }
    reduce(reduction: (a: T, b: T) => T) {
        let r: T;
        const cont: (x: T) => void = x => (r = r === undefined ? x : reduction(r, x) );
        this._iter(this._state(cont));
        return r;
    }
    fold<S>(state: S, folder: (state: S, x: T) => S) {
        let r = state;
        const cont: (x: T) => void = x =>  r = folder(r, x);
        this._iter(this._state(cont));
        return r;
    }
    static ofArray<T>(arr: T[]) {
        return new Seq<T>(arr.forEach.bind(arr), f => f);
    }
    static create<T>(iter: (callbackfn: Reducing<T>) => void) {
        return new Seq<T>(iter, f => f);
    }
}

//function DeferArray(arr, calc) {
//    this.filter = function (predicate) {
//        function combo(cont) {
//            return calc(function (x) {
//                if (predicate(x)) {
//                    cont(x);
//                }
//            });
//        }
//        return new DeferArray(arr, combo);
//    }
//    this.map = function (maper) {
//        function combo(cont) {
//            return calc(function (x) {
//                cont(maper(x));
//            })
//        }
//        return new DeferArray(arr, combo);
//    }
//    this.toArray = function () {
//        var ret = [];
//        function cont(x) {
//            ret.push(x);
//        }
//        arr.forEach(calc(cont));
//        return ret;
//    }
//}

//Array.prototype.delay = function () {
//    function calc(cont) {
//        return cont.bind(this);
//    }
//    return new DeferArray(this, calc);
//}
