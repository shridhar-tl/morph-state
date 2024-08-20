export function deepClone<T>(value: T): T {
    const references = new WeakMap<any, any>();

    function _deepClone<TInternal>(val: TInternal): TInternal {
        // Handle null or undefined
        if (val === null || val === undefined) {
            return val;
        }

        // Handle primitive types (boolean, number, string, bigint, symbol)
        if (typeof val !== 'object' && typeof val !== 'function') {
            return val;
        }

        // Handle Date
        if (val instanceof Date) {
            return new Date(val.getTime()) as any;
        }

        // Handle RegExp
        if (val instanceof RegExp) {
            return new RegExp(val) as any;
        }

        // Handle Arrays
        if (Array.isArray(val)) {
            const arrCopy: any = [];
            references.set(val, arrCopy);
            for (const item of val) {
                arrCopy.push(references.get(item) ?? _deepClone(item));
            }
            return arrCopy as any;
        }

        // Handle Set
        if (val instanceof Set) {
            const setCopy = new Set();
            references.set(val, setCopy);
            for (const item of val) {
                setCopy.add(references.get(item) ?? _deepClone(item));
            }
            return setCopy as any;
        }

        // Handle Map
        if (val instanceof Map) {
            const mapCopy = new Map();
            references.set(val, mapCopy);
            for (const [key, item] of val) {
                mapCopy.set(_deepClone(key), references.get(item) ?? _deepClone(item));
            }
            return mapCopy as any;
        }

        // Handle Objects
        if (typeof val === 'object') {
            if (references.has(val)) {
                return references.get(val);
            }
            const objCopy = Array.isArray(val) ? [] : Object.create(Object.getPrototypeOf(val));
            references.set(val, objCopy);

            for (const key of Reflect.ownKeys(val)) {
                const valKey = key as keyof typeof val;
                objCopy[valKey] = references.get(val[valKey] as any) ?? _deepClone(val[valKey]);
            }

            return objCopy as any;
        }

        // Handle functions and non-cloneable properties by returning them directly
        return val;
    }

    return _deepClone(value);
}