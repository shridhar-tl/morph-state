import React from 'react';
import { ChangeCallback, MutableState } from "./types";
import { createMutableState } from "./MutableState";
import { valueOf } from './lib/utils';

type StoreResult<T extends Record<string, any>> = {
    state: T & MutableState<T>;
    subscribe: (callback: (state: any) => void, path?: string) => () => void
};

export function createStore<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T, any>
): StoreResult<T> {
    const stateProxy = createMutableState(initialState || ({} as T), changeHandler);
    return { state: stateProxy, subscribe: stateProxy.subscribe };
}

export function createHook<T extends Record<string, any>, R>(
    store: { state: T & MutableState<T> },
    selector?: (state: T & MutableState<T>) => R
) {
    return (selectProp?: (state: T & MutableState<T>) => R, raw?: boolean) => {
        const { rootState, state } = React.useMemo(() => {
            const rootState = selector ? selector(store.state) as any : store.state as any;
            const state = selectProp ? selectProp(rootState) : rootState

            return { rootState, state };
        }, [selectProp]);

        const $ref = React.useRef({ rootState, state });

        const [, triggerUpdate] = React.useState(state);

        React.useEffect(() => {
            return store.state.subscribe(() => { // ToDo: Need to optimize it to subscribe only for specific property
                const newRootState: any = selector ? selector(store.state) : store.state;
                $ref.current.rootState = newRootState;

                if (selectProp) {
                    const newState = selectProp(newRootState);
                    $ref.current.state = raw ? valueOf(newState) : newState;
                    if (newState !== $ref.current.state) {
                        triggerUpdate({});
                    }
                } else {
                    $ref.current.state = raw ? valueOf(newRootState) : newRootState;
                    if (newRootState !== $ref.current.rootState) {
                        triggerUpdate({});
                    }
                }
            });
        }, [store.state, selectProp]);

        return $ref.current.state;
    };
}