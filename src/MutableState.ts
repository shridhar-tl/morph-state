/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import { unstable_batchedUpdates } from './batchedUpdates';
import { ChangeCallback, MutableState, Subscribers } from "./types";

export function createMutableState<T extends Record<string, any>>(
    initialState: T,
    changeHandler?: ChangeCallback<T>
): T & MutableState<T> {
    const state: T = { ...initialState }; // Ensure we're creating a new object to avoid unwanted mutations
    const subscribers: Subscribers<T> = new Set();
    const pathToCallback: Map<string, Set<Function>> = new Map();

    const notifySubscribers = (propPath?: (string | number)[]) => {
        unstable_batchedUpdates(() => {
            if (propPath) {
                const pathStr = propPath.join('.');
                const callbacks = pathToCallback.get(pathStr) || new Set();
                callbacks.forEach(callback => callback());
            }
            (Array.from(pathToCallback.keys())).forEach(path => {
                if (propPath) {
                    const propPathStr = propPath.join('.');
                    if (path.startsWith(propPathStr)) {
                        const callbacks = pathToCallback.get(path) || new Set();
                        callbacks.forEach(callback => callback());
                    }
                } else {
                    const callbacks = pathToCallback.get(path) || new Set();
                    callbacks.forEach(callback => callback());
                }
            });
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

        const pathStr: string = propPath.join('.');

        return new Proxy({
            remove: () => {
                const lastKey = propPath.pop();
                const parent = propPath.reduce((acc, key) => acc[key], state as any);
                delete parent[lastKey as keyof typeof parent];
                notifySubscribers(propPath);
            },
            changeHandler: (callback: (value: any) => void) => (event: any) => {
                const value = event.target.value;
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = propPath.reduce((acc, key) => acc[key], state as any);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }

                callback(modifiedValue);
            },
            useCallback: () => (value: any) => {
                const { modifiedValue, cancelUpdate } = buildChangeHandler(value);

                if (!cancelUpdate) {
                    const lastKey = propPath.pop();
                    const parent = propPath.reduce((acc, key) => acc[key], state as any);
                    parent[lastKey as keyof typeof parent] = modifiedValue;
                    notifySubscribers(propPath);
                }
            },
            subscribe: (callback: Function) => {
                if (!pathToCallback.has(pathStr)) {
                    pathToCallback.set(pathStr, new Set());
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const callbacks = pathToCallback.get(pathStr)!;
                callbacks.add(callback);
                return () => callbacks.delete(callback);
            }
        }, {
            get(target, prop: string, receiver) {
                if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
                if (!(state as any)[prop]) {
                    // If this is an access for a non-existing property, return a proxy for that
                    return createPathProxy([...propPath, prop]);
                }

                // If accessing an existing property, tap into the state's nested property
                const value = propPath.reduce((acc, key) => acc[key], state as any)[prop];

                // If the value is an object, return a proxy so we can again recusively do the same thing
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
                                const parent = nestedPath.reduce((acc, key) => acc[key], state as any);
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
                (state as any)[prop] = value;
                notifySubscribers([...propPath, prop]);
                return true;
            },
        });
    };

    const handler: any = {
        get(target: T, prop: string | number, receiver: any) {
            if (prop === 'toJSON') {
                return () => JSON.parse(JSON.stringify(state));
            }

            if (prop === 'replace') {
                return (newState: T) => {
                    Object.keys(newState).forEach(key => {
                        (state as any)[key] = (newState as any)[key];
                    });
                    notifySubscribers();
                };
            }

            if (prop === 'reset') {
                return () => {
                    Object.keys(initialState).forEach(key => {
                        (state as any)[key] = (initialState as any)[key];
                    });
                    notifySubscribers();
                };
            }

            if (prop in state) {
                const value = (state as any)[prop];
                if (typeof value === 'object' && value !== null) {
                    return new Proxy(value, handler);
                }
                return value;
            }

            return createPathProxy([prop]);
        },

        set(target: T, prop: string | number, value: any, receiver: any) {
            (state as any)[prop] = value;
            notifySubscribers([prop as string]);
            return true;
        },
    };

    return new Proxy(state, handler) as T & MutableState<T>;
}