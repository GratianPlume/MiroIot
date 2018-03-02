declare function setMaxDigits(value: number): void;

declare class RsaKeyPair {
    constructor(encryptionExponent: string, decryptionExponent: string, modulus: string);
}

declare function encryptedString(key: RsaKeyPair, s: string): string;

declare class IDValidator {
    isValid(value: string): boolean;
}

interface Date {
    format(fmt: string): string;
}

interface JQuery {
    multiselect(option?, parameter?, extraOptions?): any
}

type ObjectIterator<TObject, TResult> = (value: TObject[keyof TObject], key: string, collection: TObject) => TResult;
