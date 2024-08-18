import { ReactNode } from "react";

export type ChangeCallback<T> = (
    path: Array<string | number>,
    newValue: any,
    modifyNewValue: (newVal: any) => void,
    cancelChange: () => void
) => void;

export type Subscribers<T> = Set<(state: T) => void>;

export interface MutableState<T extends Record<string, any>> {
    toJSON: () => T;
    replace: (newState: T) => void;
    reset: () => void;
    [key: string]: any;
}

export interface ProxyHandlerContext<T> {
    path: Array<string | number>;
    state: T;
    subscribers: Subscribers<T>;
    changeHandler?: ChangeCallback<T>;
    initialState: T;
}

export type MutableStateHook<T extends Record<string, any>> = T & MutableState<T>;


export type ProviderProps<T> = {
    initialState?: T;
    onChange?: ChangeCallback<T>;
    children: any;
};

//type ChangeCallback<T> = (path: Array<string | number>, newValue: any, state: T) => void;