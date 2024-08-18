import React, { createContext, useContext } from 'react';
import { ProviderProps } from "./types";
import { createStore } from './store';

const MorphStateContext = createContext<any>(null);

export function MorphStateProvider<T extends Record<string, any>>({
    initialState,
    onChange,
    children
}: ProviderProps<T>): JSX.Element {
    const store = createStore(initialState, onChange);

    return (
        <MorphStateContext.Provider value={store.state}>
            {children}
        </MorphStateContext.Provider>
    );
}

export function useMorphState<T extends Record<string, any>, R = T>(
    selector?: (state: T) => R
): R | T {
    const contextState = useContext<T>(MorphStateContext);
    if (!contextState) {
        throw new Error('useMorphState must be used within a MorphStateProvider');
    }

    const [selectedState, setSelectedState] = React.useState<R | T>(() => {
        return selector ? selector(contextState) : contextState;
    });

    React.useEffect(() => {
        let unsubscribe: any;
        if (selector) {
            const relevantState: any = selector(contextState);
            const stateKeys = Object.keys(relevantState);
            unsubscribe = stateKeys.map((key) =>
                (contextState as any)[key].subscribe(() => {
                    const newState = selector(contextState);
                    setSelectedState(newState);
                })
            ).reduce((acc, val) => {
                const unsubs = Array.isArray(val) ? val : [val];
                return [...acc, ...unsubs];
            }, []);
        } else {
            unsubscribe = contextState.subscribe(setSelectedState);
        }

        return () => {
            if (Array.isArray(unsubscribe)) {
                unsubscribe.forEach(unsubscribeFn => unsubscribeFn());
            } else if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [contextState, selector]);

    return selectedState;
}