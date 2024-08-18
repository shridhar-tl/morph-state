import { useState, useRef, useEffect } from 'react';
import { MutableStateHook, MutableState, ChangeCallback } from './types';
import { createMutableState } from './MutableState';

export function useMutableState<T extends Record<string, any>>(
    initialState?: T,
    changeHandler?: ChangeCallback<T>
): MutableStateHook<T> {
    const stateRef = useRef<T & MutableState<T>>();
    const [, setState] = useState<Partial<T>>({});

    if (!stateRef.current) {
        stateRef.current = createMutableState(
            initialState || ({} as T),
            changeHandler
        );
    }

    useEffect(() => (stateRef.current as any).subscribe(() => setState({})), []);

    return stateRef.current;
}