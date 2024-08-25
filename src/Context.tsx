import React, { createContext, useContext, useRef } from 'react';
import { ConfigObject, ConfigOption, MutableState, ProviderProps } from "./types";
import { createMutableState } from './MutableState';
import { normalizeConfig } from './lib/utils';
import { valueOf, withConfig } from './lib/helpers';

const MorphStateContext = createContext<any>(null);

export function MorphStateProvider<T extends Record<string, any>>({
    initialState,
    onChange,
    config,
    children
}: ProviderProps<T>): JSX.Element {
    const stateRef = useRef<MutableState<T>>();

    if (!stateRef.current) {
        let secondParam: any;
        const hasConfig = config !== undefined && config !== null;
        if (hasConfig && onChange) {
            const { config: newConfig } = normalizeConfig(config as any);
            secondParam = { ...newConfig, onChange };
        } else if (hasConfig) {
            secondParam = config;
        } else if (onChange) {
            secondParam = onChange;
        }

        stateRef.current = createMutableState(initialState || ({} as T), secondParam);
    }

    return (
        <MorphStateContext.Provider value={stateRef.current}>
            {children}
        </MorphStateContext.Provider>
    );
}

export function useMorphState<T extends Record<string, any>, R = T>(
    selector?: (state: MutableState<T>) => R,
    config?: ConfigObject
): R | T {
    const contextState = useContext<T>(MorphStateContext);

    if (!contextState) {
        throw new Error('useMorphState must be used within a MorphStateProvider');
    }

    if (typeof selector !== "function" && selector !== undefined || selector !== null && (config === undefined || config === null)) {
        config = selector as any;
        selector = undefined as any;
    }

    const rootState = React.useMemo(() =>
        (config === undefined || config === null)
            ? contextState
            : withConfig(contextState, config)
        , [contextState, config]);

    const [selectedState, setSelectedState] = React.useState<R | T>(() => {
        return selector ? selector(rootState) : rootState;
    });

    React.useEffect(() => {
        const pathSelector = selector;
        if (pathSelector) {
            return contextState.subscribe(() => { // ToDo: Need to optimize it to subscribe only for specific property
                const newState = pathSelector(rootState);
                setSelectedState(newState);
            });
        } else {
            return contextState.subscribe(() => setSelectedState({} as any));
        }
    }, [rootState, selector]);

    return selector ? selectedState : rootState;
}