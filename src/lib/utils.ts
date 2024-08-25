import { ChangeCallback, ConfigObject, ConfigOption, InterceptorConfig } from "../types";

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

export function setObjectValue(obj: any, path: string[], value?: any): any {
    const currentValue = getObjectValue(obj, path);

    if (currentValue === value) { return obj; } // If target value is same as current value, then return same object.

    return setObjValue(obj, path, value);
}

function setObjValue(obj: any, path: string[], value?: any): any {
    if (path.length === 0) return value;

    const [key, ...restPath] = path;

    if (obj === null || typeof obj !== 'object') {
        obj = {};
    } else if (Array.isArray(obj)) {
        obj = [...obj];
    } else if (obj instanceof Map) {
        obj = new Map(obj);
    } else {
        obj = { ...obj };
    }

    if (obj instanceof Map) {
        if (restPath.length === 0 && value === undefined) {
            obj.delete(key);
        } else {
            const cloneValue = setObjValue(obj.get(key), restPath, value);
            obj.set(key, cloneValue);
        }
    } else {
        if (restPath.length === 0 && value === undefined) {
            delete obj[key];
        } else {
            obj[key] = setObjValue(obj[key], restPath, value);
        }
    }

    return obj;
}

export function getObjectValue(obj: any, path: string[]): any {
    let current = obj;

    for (let i = 0; i < path.length; i++) {
        const key = path[i];

        if (current === null || current === undefined) {
            return undefined;
        }

        if (current instanceof Map) {
            current = current.get(key);
        } else if (typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }

    return current;
}


export function normalizeConfig<T>(configOrCallback?: ConfigOption<T> | ConfigObject) {
    let changeHandler!: ChangeCallback<T, any>;
    let config: InterceptorConfig = {};

    if (typeof configOrCallback === "function") {
        changeHandler = configOrCallback;
    } else if (configOrCallback && typeof configOrCallback === "object") {
        const { onChange: handler, ...configOptions } = configOrCallback as any;
        if (typeof handler === "function") {
            changeHandler = handler;
        }
        config = configOptions;
    } else if (typeof configOrCallback === "boolean") {
        config = {
            interceptArrays: configOrCallback,
            interceptNull: configOrCallback,
            interceptObjects: configOrCallback,
            interceptSpecialObjects: configOrCallback,
            interceptUndefined: configOrCallback,
            interceptValues: configOrCallback,
        };
    }

    return { changeHandler, config };
}