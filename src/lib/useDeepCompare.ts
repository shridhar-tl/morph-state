import React from 'react'
import deepCompare from './deep-compare'


export function useDeepCompare<S, U>(selector: (state: S) => U): (state: S) => U {
    const prev = React.useRef<U>()

    return React.useCallback((state) => {
        const newState = selector(state);

        if (!deepCompare(prev.current, newState)) {
            prev.current = newState;
        }

        return prev.current as U;
    }, [selector]);
}