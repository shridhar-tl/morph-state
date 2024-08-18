/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import { unstable_batchedUpdates } from './batchedUpdates';
import { ChangeCallback, MutableState } from "./types";

const rootSubscriberKey = '';

type StateWrapper<T> = { current: T };

export function createMutableState<T extends Record<string, any>>(
    initialState: T,
    changeHandler?: ChangeCallback<T>
): T & MutableState<T> {
    const constructInitialState = () => initialState ? JSON.parse(JSON.stringify(initialState)) : {};
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

    const createPathProxy = (propPath: Array<string | number>): any => {
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

        return new Proxy({
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
                const pathStr: string = propPath.join('.');
                if (!pathToCallback.has(pathStr)) {
                    pathToCallback.set(pathStr, new Set());
                }
                const callbacks = pathToCallback.get(pathStr) as Set<Function>;
                callbacks.add(callback);
                return () => callbacks.delete(callback);
            }
        }, {
            get(target, prop: string, receiver) {
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
            set(target, prop: string, value) {
                (state.current as any)[prop] = value;
                notifySubscribers([...propPath, prop]);
                return true;
            },
        });
    };

    const handler: any = {
        get(target: T, prop: string | number, receiver: any) {
            if (prop === 'toJSON') {
                return () => JSON.parse(JSON.stringify(state.current));
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