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
    selector?: (state: T) => R
) {
    return (selectProp?: (subState: R) => any) => {
        const [state, setState] = React.useState(() => {
            const selectedSlice: R = selector ? selector(store.state) as R : store.state as R;
            return selectProp ? selectProp(selectedSlice) : selectedSlice;
        });

        React.useEffect(() => {
            const selectedSlice: R = selector ? selector(store.state) as R : store.state as R;
            const selectedPath = selectProp ? selectProp(selectedSlice) as string : null;
            let unsubscribe;

            if (selectedPath) {
                unsubscribe = store.state[selectedPath].subscribe(setState);
            } else if (selectedSlice && typeof selectedSlice === 'object') {
                const stateEntries = Object.entries(selectedSlice);
                const unsubscribes = stateEntries.map(([innerKey]) => store.state[innerKey].subscribe(setState));
                unsubscribe = () => unsubscribes.forEach(u => u());
            } else {
                unsubscribe = store.state.subscribe(setState);
            }

            return unsubscribe;
        }, [store.state, selectProp]);

        return state;
    };
}