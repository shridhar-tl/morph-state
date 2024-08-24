/* eslint-disable @typescript-eslint/ban-types */
import { unstable_batchedUpdates } from './batchedUpdates';
import { deepClone, getObjectValue, setObjectValue } from './lib/utils';
import { ChangeCallback, InterceptorConfig, MutableState, StateProperty } from "./types";

const rootSubscriberKey = '';

type StateWrapper<T> = { current: T };

export function createMutableState<T extends Record<string, any>>(
    initialState?: T,
    configOrCallback?: ChangeCallback<T, any> | (InterceptorConfig & { changeHandler: ChangeCallback<T, any> })
): MutableState<T> {
    let changeHandler!: ChangeCallback<T, any>;
    let config!: InterceptorConfig;

    if (typeof configOrCallback === "function") {
        changeHandler = configOrCallback;
    } else if (configOrCallback && typeof configOrCallback === "object") {
        const { changeHandler: handler, ...configOptions } = configOrCallback;
        if (typeof handler === "function") {
            changeHandler = handler;
        }
        config = configOptions;
    }

    const __ms__ref = "s7jebsld"; // Need to generate random id
    const constructInitialState = () => initialState ? deepClone(initialState) : {} as T;
    const state: StateWrapper<T> = { current: constructInitialState() };

    // Contains reference to all the subscribers based on individual path
    const pathToCallback: Map<string, Set<Function>> = new Map();

    // Contains list of subscribers to notify based on currently running changes
    const subscribersToNotify = new Set<string>(); // This would be cleared every time after notified

    // Contains the reference for timer when subscriber notification is scheduled
    let subscriberRunner: (NodeJS.Timeout | null) = null;

    const notifySubscribers = (pathStr: string) => {
        subscribersToNotify.add(pathStr);

        if (subscriberRunner) { return; } // This means already subscriber is waiting to run

        subscriberRunner = setTimeout(() => {
            subscriberRunner = null; // Clear the schedule reference when execution starts

            // Batch react specific rerendering
            unstable_batchedUpdates(() => {
                const availableSubscribers = Array.from(pathToCallback.keys());
                const finalSubscriberPathsToNotify = new Set<string>();
                subscribersToNotify.forEach(path => {
                    const toNotify = availableSubscribers.filter(p => p === path || path.startsWith(`${p}.`))
                    toNotify.forEach(p => finalSubscriberPathsToNotify.add(p));
                });

                subscribersToNotify.clear(); // Clear the paths list after collating the list
                finalSubscriberPathsToNotify.add(rootSubscriberKey); // Notify root subscribers if any part of the state changes

                const finalSubscribersToNotify = new Set<Function>();
                finalSubscriberPathsToNotify.forEach(p => {
                    const callbacks = pathToCallback.get(p);
                    if (callbacks) {
                        callbacks.forEach(c => finalSubscribersToNotify.add(c));
                    }
                });

                finalSubscribersToNotify.forEach(callback => callback());
            });
        }, 0);
    };


    function subscribe(callback: Function, path?: string) {
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

    function setHandlersForSpecialObjects(proxyBase: any) {
        const curValue = proxyBase.$value;
        if (curValue && curValue instanceof Set) {
            (proxyBase as any).add = (value: any) => {
                const newSetObj = new Set(curValue);
                newSetObj.add(value);
                proxyBase.$changeHandler(newSetObj);
                return newSetObj;
            };
            (proxyBase as any).delete = (value: any) => {
                const newSetObj = new Set(curValue);
                newSetObj.delete(value);
                proxyBase.$changeHandler(newSetObj);
                return newSetObj;
            };
            (proxyBase as any).clear = () => {
                const newSetObj = new Set();
                proxyBase.$changeHandler(newSetObj);
                return newSetObj;
            };
        } else if (Array.isArray(curValue)) {
            (proxyBase as any).push = (value: any) => {
                const newArr = [...curValue, value];
                proxyBase.$changeHandler(newArr);
                return newArr;
            };
        }
    }

    function buildChangeHandler(newValue: any, pathStr = '', callback: ChangeCallback<T, any> | undefined = changeHandler) {
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
    }

    const rootObject = {
        toJSON: () => deepClone(state.current),
        replace: (newState: T) => {
            state.current = newState;
            notifySubscribers(rootSubscriberKey);
        },
        reset: () => rootObject.replace(constructInitialState()),
        subscribe,
        withConfig,
        __ms__ref
    };

    function withConfig(config: InterceptorConfig) {
        const { interceptUndefined, interceptNull, interceptObjects, interceptArrays, interceptSpecialObjects, interceptValues } = config;

        const memoizedProxies = new Map<string, StateProperty>();

        function setStatePropValue(path: string[], buildChangeHandler: any = changeHandler, value?: any) {
            const { modifiedValue, cancelUpdate } = buildChangeHandler?.(value) ?? { modifiedValue: value };

            if (!cancelUpdate) {
                const newState = setObjectValue(state.current, path, modifiedValue);
                if (newState !== state.current) {
                    const fullPath = path.join('.');
                    clearMemoizedProxies(memoizedProxies, fullPath);
                    state.current = newState;
                    notifySubscribers(fullPath);
                }
            }
        }

        function getHandlerForProxy(propPath?: string[], changeHandlerBuilderFunction: any = buildChangeHandler) {
            return {
                get(target: any, prop: string, receiver: any) {
                    if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

                    if (prop === "__ms_prx") {
                        return true;
                    }

                    if (Object.hasOwn(target, prop)) { // Target will only contain api functions like $value, $subscribe, $changeHandler, etc
                        return target[prop];
                    }

                    if (prop === '$value') { // This will happen only for root state
                        return deepClone(state.current);
                    }

                    const value = getObjectValue(propPath ? target.$value : state.current, [prop]);
                    const valueType = typeof value;

                    if (valueType === "undefined") {
                        if (interceptUndefined !== true) {
                            return value;
                        }
                    } else if (value === null) {
                        if (interceptNull !== true) {
                            return value;
                        }
                    } else if (Array.isArray(value)) {
                        if (interceptArrays === false) {
                            return value;
                        }
                    } else if (value instanceof Map || value instanceof Set) {
                        if (interceptSpecialObjects === false) {
                            return value;
                        }
                    } else if (valueType === "object" && !(value instanceof Date) && !(value instanceof String)) {
                        if (interceptObjects === false) {
                            return value;
                        }
                    } else if (interceptValues !== true) {
                        return value;
                    }

                    return createPathProxy(propPath ? [...propPath, prop] : [prop]);
                },
                set(_: any, prop: string, value: any) {
                    setStatePropValue(propPath ? [...propPath, prop] : [prop], changeHandlerBuilderFunction, value);
                    return true;
                },
            }
        }

        function createPathProxy(propPath: Array<string>): StateProperty {
            const isValidPath = propPath.every(v => typeof v === 'string');
            const pathStr: string = isValidPath ? propPath.join('.') : '';

            let memoizedInstance = memoizedProxies.get(pathStr) as StateProperty;
            if (memoizedInstance) {
                return memoizedInstance;
            }

            const proxyBase = {
                $value: getObjectValue(state.current, propPath),
                $remove: () => setStatePropValue(propPath, (v: any) => buildChangeHandler(v, pathStr)),
                $eventHandler: (callback?: (value: any) => void) => (event: any) => setStatePropValue(propPath, (v: any) => buildChangeHandler(v, pathStr, callback), event.target.value),
                $changeHandler: (value: any) => setStatePropValue(propPath, (v: any) => buildChangeHandler(v, pathStr), value),
                $subscribe: (callback: Function) => subscribe(callback, pathStr)
            };

            setHandlersForSpecialObjects(proxyBase);

            memoizedInstance = new Proxy(proxyBase, getHandlerForProxy(propPath, buildChangeHandler));

            if (pathStr) {
                memoizedProxies.set(pathStr, memoizedInstance);
            }

            return memoizedInstance;
        }

        return new Proxy({
            ...rootObject,
            withConfig: (newConfig: InterceptorConfig) => withConfig({ ...config, ...newConfig })
        }, getHandlerForProxy()) as MutableState<T>;
    }

    return withConfig(config ?? {});
}


function clearMemoizedProxies(memoizedProxies: Map<string, StateProperty>, fullPath: string) {
    const fullPathDot = `${fullPath}.`; // Should clear memoized proxies for nested props also
    memoizedProxies.forEach((_, key) => {
        if (key === fullPath || key.startsWith(fullPathDot) || fullPath.startsWith(`${key}.`)) {
            memoizedProxies.delete(key);
        }
    });
}