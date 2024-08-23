/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import { unstable_batchedUpdates } from './batchedUpdates';
import { deepClone } from './lib/utils';
import { ChangeCallback, MutableState, StateProperty } from "./types";

const rootSubscriberKey = '';

type StateWrapper<T> = { current: T };

export function createMutableState<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T, any>
): T & MutableState<T> {
    const constructInitialState = () => initialState ? deepClone(initialState) : {} as T;
    const state: StateWrapper<T> = { current: constructInitialState() };

    const pathToCallback: Map<string, Set<Function>> = new Map();

    const notifySubscribers = (propPath: (string | number)[]) => {
        unstable_batchedUpdates(() => {
            let path = "";
            for (const key of propPath) {
                path = path ? `${path}.${key}` : String(key);
                const callbacks = pathToCallback.get(path);
                callbacks?.forEach(callback => callback());
            }

            // Notify root subscribers if any part of the state changes
            pathToCallback.get(rootSubscriberKey)?.forEach(callback => callback());
        });
    };

    const memoizedProxies = new Map<string, StateProperty>();

    function clearMemoizedProxies(fullPath: string) {
        // Clear all memoized proxies
        const fullPathDot = `${fullPath}.`; // Should clear memoized proxies for nested props also
        memoizedProxies.forEach((_, key) => {
            if (key === fullPath || key.startsWith(fullPathDot)) {
                memoizedProxies.delete(key);
            }
        });
    }

    const createPathProxy = (propPath: Array<string>): StateProperty => {
        const isValidPath = propPath.every(v => typeof v === 'string');
        const pathStr: string = isValidPath ? propPath.join('.') : '';

        let memoizedInstance = memoizedProxies.get(pathStr) as StateProperty;
        if (memoizedInstance) {
            return memoizedInstance;
        }

        const buildChangeHandler = (newValue: any, callback: ChangeCallback<T, any> | undefined = changeHandler) => {
            let modifiedValue = newValue;
            let cancelUpdate = false;

            const modifyNewValue = (value: any) => {
                modifiedValue = value;
            };

            const cancelChange = () => {
                cancelUpdate = true;
            };

            if (callback) {
                callback(newValue, { field: pathStr, cancel: cancelChange, update: modifyNewValue });
            }

            return { modifiedValue, cancelUpdate };
        };

        memoizedInstance = new Proxy({
            $value: () => {
                return getPropValue(state.current, propPath);
            },
            $remove: () => {
                const lastKey = propPath.pop();
                const parent = getPropValue(state.current, propPath);
                if (!parent) { return; }
                delete parent[lastKey as keyof typeof parent];
                notifySubscribers(propPath);
            },
            $eventHandler: (callback?: (value: any) => void) => (event: any) => {
                const value = event.target.value;
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value, callback ?? changeHandler);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = getPropValue(state.current, propPath);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }
            },
            $changeHandler: (value: any) => {
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = getPropValue(state.current, propPath);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }
            },
            $subscribe: (callback: Function) => {
                if (!pathToCallback.has(pathStr)) {
                    pathToCallback.set(pathStr, new Set());
                }

                const callbacks = pathToCallback.get(pathStr) as Set<Function>;
                callbacks.add(callback);

                return () => callbacks.delete(callback);
            }
        }, {
            get(target: any, prop: string, receiver: any) {
                if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

                if (target[prop]) { // Target will only contain api functions like $value, $subscribe, $changeHandler, etc
                    return target[prop];
                }

                return createPathProxy([...propPath, prop]);
            },
            set(target: any, prop: string, value: any) {
                const parent = propPath.reduce((obj, cur) => {
                    const p = obj[cur] ?? {}; // If no object exists for current path, then create that object
                    obj[cur] = p;
                    return p;
                }, state.current as any);

                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);
                if (!cancelUpdate) {
                    clearMemoizedProxies(pathStr ? `${pathStr}.${prop}` : prop);
                    parent[prop] = modifiedValue;

                    notifySubscribers([...propPath, prop]);
                }

                return true;
            },
        });

        if (pathStr) {
            memoizedProxies.set(pathStr, memoizedInstance);
        }

        return memoizedInstance;
    };

    const handler: any = {
        get(target: T, prop: string, receiver: any) {
            if (prop === 'toJSON') {
                return () => deepClone(state.current);
            }

            if (prop === 'replace') {
                return (newState: T) => {
                    state.current = newState;
                    notifySubscribers([]);
                };
            }

            if (prop === 'reset') {
                return () => {
                    state.current = constructInitialState();
                    notifySubscribers([]);
                };
            }

            if (prop === 'subscribe') {
                return (callback: Function, path?: string) => {
                    if (!path || typeof path !== 'string') {
                        path = rootSubscriberKey;
                    }

                    if (!pathToCallback.has(path)) {
                        pathToCallback.set(path, new Set());
                    }

                    const callbacks = pathToCallback.get(path) as Set<Function>;
                    callbacks.add(callback);

                    return () => callbacks.delete(callback);
                }
            }

            return createPathProxy([prop]);
        },

        set(target: T, prop: string, value: any, receiver: any) {
            let modifiedValue = value;
            let cancelUpdate = false;

            const modifyNewValue = (value: any) => {
                modifiedValue = value;
            };

            const cancelChange = () => {
                cancelUpdate = true;
            };

            if (changeHandler) {
                changeHandler(modifiedValue, { field: prop, cancel: cancelChange, update: modifyNewValue });
            }

            if (!cancelUpdate) {
                clearMemoizedProxies(prop);
                (state.current as any)[prop] = modifiedValue;
                notifySubscribers([prop]);
            }

            return true;
        },
    };

    return new Proxy(state.current, handler) as T & MutableState<T>;
}

function getPropValue(state: any, propPath: string[]) {
    return propPath.reduce((acc, key) => acc?.[key], state);
}