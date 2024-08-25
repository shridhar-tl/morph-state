import { useState, useRef, useEffect } from 'react';
import { MutableState, ConfigOption } from './types';
import { createMutableState } from './MutableState';

export function useMutableState<T extends Record<string, any>>(initialState?: T, configOrCallback?: ConfigOption<T>
): MutableState<T> {
    const stateRef = useRef<MutableState<T>>();
    const [, setState] = useState<Partial<T>>({});

    if (!stateRef.current) {
        stateRef.current = createMutableState(initialState || ({} as T), configOrCallback);
    }

    useEffect(() => (stateRef.current as any).subscribe(() => setState({})), []);

    return stateRef.current;
}