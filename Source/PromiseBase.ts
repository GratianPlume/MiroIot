class PromiseBase<T> implements Promise<T> {

    private _resolve: (value: T) => void;
    private _reject: (reason: any) => void;
    constructor(resolve?, reject?) {
        this._resolve = resolve;
        this._reject = reject;
    }

    private isPromiseLike<TLike>(value): value is PromiseLike<TLike> {
        return !!((value as PromiseLike<TLike>).then);
    }

    private tryPromiseLike<TResultX>(promise: PromiseBase<TResultX>, result: PromiseLike<TResultX>) {
        result.then(value => {
            if (promise._resolve) {
                promise._resolve(value);
            }
        });
    }

    private continue<TResult>(result: TResult | PromiseLike<TResult>, resolve: (x: TResult) => void) {
        if (this.isPromiseLike(result)) {
            result.then(x => {
                if (resolve) resolve(x);
            });
        } else if (resolve) {
            resolve(result);
        }
    }

    then<TResult1 = T, TResult2 = never>(
            onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null)
        : Promise<TResult1 | TResult2> {

        const promise = new PromiseBase<TResult1 | TResult2>();

        if (onfulfilled) {
            this._resolve = (value: T) => {
                const result = onfulfilled(value);
                this.continue(result, promise._resolve);
            }
        }

        if (onrejected) {
            this._reject = (reason: any) => {
                const result = onrejected(reason);
                this.continue(result, promise._resolve);
            }
        }
        return promise;
    }

    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
        const promise = new PromiseBase<T | TResult>();

        this._reject = (reason: any) => {
            if (onrejected) {
                const result = onrejected(reason);
                this.continue(result, promise._resolve);
            }
        }
        return promise;
    }

}