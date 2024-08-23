/* eslint-disable @typescript-eslint/ban-types */

type CallbackPropType<N> = {
    field: string,
    update: (newVal: N) => void,
    cancel: () => void
}

export type ChangeCallback<T, N> = (
    newValue: T,
    props: CallbackPropType<N>
) => void;

export type Subscribers<T> = Set<(state: T) => void>;

export interface MutableState<T extends Record<string, any>> {
    toJSON: () => T;
    replace: (newState: T) => void;
    reset: () => void;
    [key: string]: any;
}

export interface StateProperty {
    remove: () => void;
    changeHandler: (callback: (value: any) => void) => (event: any) => void;
    useCallback: () => (value: any) => void;
    subscribe: (callback: Function) => Function;
}

export interface ProxyHandlerContext<T> {
    path: Array<string | number>;
    state: T;
    subscribers: Subscribers<T>;
    changeHandler?: ChangeCallback<T, any>;
    initialState: T;
}

export type MutableStateHook<T extends Record<string, any>> = T & MutableState<T>;


export type ProviderProps<T> = {
    initialState?: T;
    onChange?: ChangeCallback<T, any>;
    children: any;
};
