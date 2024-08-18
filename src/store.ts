import React from 'react';
import { ChangeCallback, MutableState } from "./types";
import { createMutableState } from "./MutableState";

export function createStore<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T>
): { state: T & MutableState<T> } {
    const stateProxy = createMutableState(initialState || ({} as T), changeHandler);
    return { state: stateProxy };
}

export function createHook<T extends Record<string, any>, R>(
    store: { state: T & MutableState<T> },
    selector?: (state: T & MutableState<T>) => R
) {
    return (selectProp?: (state: T & MutableState<T>) => R) => {
        const rootState = React.useMemo<any>(() =>
            selector ? selector(store.state) as any : store.state as any, []);

        const state = React.useMemo(() => selectProp ? selectProp(rootState) : rootState, []);

        const $ref = React.useRef({ rootState, state });

        const [, triggerUpdate] = React.useState(state);

        React.useEffect(() => {
            return store.state.subscribe(() => { // ToDo: Need to optimize it to subscribe only for specific property
                const newRootState: any = selector ? selector(store.state) : store.state;
                $ref.current.rootState = newRootState;

                if (selectProp) {
                    const newState = selectProp(newRootState);
                    $ref.current.state = newState;
                    if (typeof newState === "object" || newState !== $ref.current.state) {
                        triggerUpdate({});
                    }
                } else {
                    $ref.current.state = rootState;
                    if (typeof rootState === "object" || rootState !== $ref.current.rootState) {
                        triggerUpdate({});
                    }
                }
            });
        }, [store.state, selectProp]);

        return $ref.current.state;
    };
}