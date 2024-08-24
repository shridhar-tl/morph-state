import React, { createContext, useContext, useRef } from 'react';
import { MutableState, ProviderProps } from "./types";
import { createMutableState } from './MutableState';
import { valueOf } from './lib/utils';

const MorphStateContext = createContext<any>(null);

export function MorphStateProvider<T extends Record<string, any>>({
    initialState,
    onChange,
    children
}: ProviderProps<T>): JSX.Element {
    const stateRef = useRef<T & MutableState<T>>();

    if (!stateRef.current) {
        stateRef.current = createMutableState(initialState || ({} as T), onChange);
    }

    return (
        <MorphStateContext.Provider value={stateRef.current}>
            {children}
        </MorphStateContext.Provider>
    );
}

export function useMorphState<T extends Record<string, any>, R = T>(
    selector?: (state: T) => R,
    raw?: boolean
): R | T {
    const contextState = useContext<T>(MorphStateContext);

    if (!contextState) {
        throw new Error('useMorphState must be used within a MorphStateProvider');
    }

    const [selectedState, setSelectedState] = React.useState<R | T>(() => {
        return selector ? selector(contextState) : contextState;
    });

    React.useEffect(() => {
        if (selector) {
            //const relevantState: any = selector(contextState);
            return contextState.subscribe(() => { // ToDo: Need to optimize it to subscribe only for specific property
                const newState = selector(contextState);
                setSelectedState(raw ? valueOf(newState) : newState);
            });
        } else {
            return contextState.subscribe(() => setSelectedState({} as any));
        }
    }, [contextState, selector]);

    return selector ? selectedState : contextState;
}