/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import { unstable_batchedUpdates } from './batchedUpdates';
import { deepClone } from './lib/utils';
import { ChangeCallback, MutableState, StateProperty } from "./types";

const rootSubscriberKey = '';

type StateWrapper<T> = { current: T };

export function createMutableState<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T>
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
    const createPathProxy = (propPath: Array<string>): StateProperty => {
        const isValidPath = propPath.some(v => typeof v !== 'string');
        const pathStr: string = isValidPath ? propPath.join('.') : '';

        let memoizedInstance = memoizedProxies.get(pathStr) as StateProperty;
        if (memoizedInstance) {
            return memoizedInstance;
        }

        const buildChangeHandler = (newValue: any) => {
            let modifiedValue = newValue;
            let cancelUpdate = false;

            const modifyNewValue = (value: any) => {
                modifiedValue = value;
            };

            const cancelChange = () => {
                cancelUpdate = true;
            };

            if (changeHandler) {
                changeHandler(propPath, newValue, modifyNewValue, cancelChange);
            }

            return { modifiedValue, cancelUpdate };
        };

        memoizedInstance = new Proxy({
            remove: () => {
                const lastKey = propPath.pop();
                const parent = propPath.reduce((acc, key) => acc[key], state.current as any);
                delete parent[lastKey as keyof typeof parent];
                notifySubscribers(propPath);
            },
            changeHandler: (callback: (value: any) => void) => (event: any) => {
                const value = event.target.value;
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = propPath.reduce((acc, key) => acc[key], state.current as any);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }

                callback(modifiedValue);
            },
            useCallback: () => (value: any) => {
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = propPath.reduce((acc, key) => acc[key], state.current as any);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }
            },
            subscribe: (callback: Function) => {
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

                /*if (prop === 'subscribe') {
                    return function (callback: Function) {
                        if (!pathToCallback.has(rootSubscriberKey)) {
                            pathToCallback.set(rootSubscriberKey, new Set());
                        }
                        const callbacks = pathToCallback.get(rootSubscriberKey) as Set<Function>;
                        callbacks.add(callback);
                        return () => callbacks.delete(callback);
                    };
                }*/

                if (!(state.current as any)[prop]) {
                    return createPathProxy([...propPath, prop]);
                }

                const value = propPath.reduce((acc, key) => acc[key], state.current as any)[prop];
                if (typeof value === 'object' && value !== null) {
                    return new Proxy(value, {
                        get(innerTarget, innerProp: string, innerReceiver) {
                            return createPathProxy([...propPath, prop, innerProp]);
                        },
                        set(innerTarget, innerProp: string, newValue) {
                            const nestedPath = [...propPath, prop, innerProp];
                            const { modifiedValue, cancelUpdate } = buildChangeHandler(newValue);
                            if (!cancelUpdate) {
                                const lastKey = nestedPath.pop();
                                const parent = nestedPath.reduce((acc, key) => acc[key], state.current as any);
                                parent[lastKey as keyof typeof parent] = modifiedValue;
                                notifySubscribers(nestedPath);
                            }
                            return true;
                        },
                    });
                } else {
                    return value;
                }
            },
            set(target: any, prop: string, value: any) {
                // Clear all memoized proxies
                const fullPath = pathStr ? `${pathStr}.${prop}` : prop;
                const fullPathDot = pathStr ? `${pathStr}.${prop}.` : `${prop}.`; // Should clear memoized proxies for nested props also
                Object.keys(memoizedProxies).forEach(key => {
                    if (key === fullPath || key.startsWith(fullPathDot)) {
                        memoizedProxies.delete(key);
                    }
                });

                const parent = propPath.reduce((obj, cur) => {
                    const p = obj[cur] ?? {}; // If no object exists for current path, then create that object
                    obj[cur] = p;
                    return p;
                }, state.current as any);

                parent[prop] = value;

                notifySubscribers([...propPath, prop]);

                return true;
            },
        });

        memoizedProxies.set(pathStr, memoizedInstance);

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
                return (callback: Function) => {
                    if (!pathToCallback.has(rootSubscriberKey)) {
                        pathToCallback.set(rootSubscriberKey, new Set());
                    }

                    const callbacks = pathToCallback.get(rootSubscriberKey) as Set<Function>;
                    callbacks.add(callback);
                    return () => callbacks.delete(callback);
                }
            }

            if (prop in state.current) {
                const value = (state.current as any)[prop];
                if (value && typeof value !== 'object') {
                    return value;
                }
            }

            return createPathProxy([prop]);
        },

        set(target: T, prop: string | number, value: any, receiver: any) {
            (state.current as any)[prop] = value;
            notifySubscribers([prop as string]);
            return true;
        },
    };

    return new Proxy(state.current, handler) as T & MutableState<T>;
}
