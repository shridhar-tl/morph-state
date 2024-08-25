import React from 'react';
import { ConfigOption, InterceptorConfig, MutableState, StateProperty, SubscribeFunction } from "./types";
import { createMutableState } from "./MutableState";
import { withConfig } from './lib/helpers';

type StoreResult<T extends Record<string, any>> = {
    state: MutableState<T>;
    subscribe: SubscribeFunction
};

export function createStore<T extends Record<string, any>>(initialState?: T, configOrCallback?: ConfigOption<T>): StoreResult<T> {
    const stateProxy = createMutableState(initialState || ({} as T), configOrCallback);
    return { state: stateProxy, subscribe: stateProxy.subscribe };
}

export function createHook<T extends Record<string, any>, R>(
    store: StoreResult<T>,
    selector?: (state: MutableState<T>) => StateProperty
) {
    return (selectProp?: (state: MutableState<T>) => R | StateProperty, config?: InterceptorConfig): any => {
        if (config === undefined && typeof selectProp === 'object') {
            config = selectProp;
            selectProp = undefined;
        }

        const storeState = React.useMemo(() => config ? withConfig(store, config) : store.state, [config]);

        const { rootState, state } = React.useMemo(() => {
            const rootState = selector ? selector(storeState) as any : storeState as any;
            const state = selectProp ? selectProp(rootState) : rootState

            return { rootState, state };
        }, [selectProp, storeState]);

        const $ref = React.useRef({ rootState, state });

        const [, triggerUpdate] = React.useState(state);

        React.useEffect(() => {
            return store.state.subscribe(() => { // ToDo: Need to optimize it to subscribe only for specific property
                const newRootState: any = selector ? selector(storeState) : storeState;

                if (selectProp) {
                    const newState = selectProp(newRootState);
                    if (newState !== $ref.current.state) {
                        $ref.current.state = newState;
                        triggerUpdate({});
                    }
                } else if (selector && newRootState !== $ref.current.state) {
                    $ref.current.state = newRootState;
                    triggerUpdate({});
                } else {
                    $ref.current.state = newRootState;
                    triggerUpdate({});
                }

                $ref.current.rootState = newRootState;
            });
        }, [store.state, selectProp]);

        return $ref.current.state;
    };
}