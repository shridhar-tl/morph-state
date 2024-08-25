export type InterceptorConfig = {
    interceptUndefined?: boolean,
    interceptNull?: boolean,
    interceptObjects?: boolean,
    interceptValues?: boolean,
    interceptArrays?: boolean,
    interceptSpecialObjects?: boolean,
}

export type MutableState<T extends Record<string, any>> = T & {
    toJSON: () => T;
    replace: (newState: T) => void;
    reset: () => void;
    subscribe: SubscribeFunction;
}

export interface StateProperty {
    $remove: () => void;
    $eventHandler: (callback: (value: any) => void) => (event: any) => void;
    $changeHandler: (value: any) => void;
    $subscribe: NestedSubscribeFunction;
    [key: string]: StateProperty | any;
}


export type ChangeCallback<T, N> = (
    newValue: T,
    props: CallbackPropType<N>
) => void;

type CallbackPropType<N> = {
    field: string,
    update: (newVal: N) => void,
    cancel: () => void
}


export type SubscribeFunction = (callback: SubscribeCallback, path?: string) => () => void;
export type NestedSubscribeFunction = (callback: SubscribeCallback) => () => void;
export type SubscribeCallback = () => void;

export type ProviderProps<T> = {
    initialState?: T;
    onChange?: ChangeCallback<T, any>;
    config?: InterceptorConfig;
    children: any;
};

export type ConfigObject = InterceptorConfig | boolean;

export type ConfigOption<T> = ChangeCallback<T, any> | (ConfigObject & { onChange: ChangeCallback<T, any> });
