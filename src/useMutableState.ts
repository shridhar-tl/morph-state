import { useState, useRef, useEffect } from 'react';
import { MutableStateHook, MutableState, ChangeCallback, Subscribers } from './types';
import { createMutableState } from './MutableState';

export function useMutableState<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T>
): MutableStateHook<T> {
    const stateRef = useRef<T & MutableState<T>>();
    const [, setState] = useState<T | any>({});

    if (!stateRef.current) {
        stateRef.current = createMutableState(
            initialState || ({} as T),
            changeHandler
        );
    }

    useEffect(() => {
        const subscribers = stateRef.current?.__subscribers as Subscribers<T>;
        subscribers.add(setState);

        return () => {
            subscribers.delete(setState);
        };
    }, []);

    return stateRef.current;
}