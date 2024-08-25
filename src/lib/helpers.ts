import { ChangeCallback, ConfigObject } from "../types";

export function withChangeHandler(state: any): (e: any) => void {
    return state.$changeHandler;
}

export function withEventHandler<T, N>(state: any, filter?: ChangeCallback<T, N>): (e: any) => void {
    return state.$eventHandler(filter);
}

export function valueOf(state: any): any {
    return state?.__ms_prx ? state.$value : state;
}

export function isUndefined(state: any): boolean {
    return valueOf(state) === undefined;
}

export function isNull(state: any): boolean {
    return valueOf(state) === null;
}

export function isNullOrUndefined(state: any): boolean {
    const value = valueOf(state);
    return value === undefined || value === null;
}

export function isTruthy(state: any): boolean {
    return Boolean(valueOf(state));
}

export function withConfig(store: any, config: ConfigObject) {
    return store?.withConfig?.(config);
}