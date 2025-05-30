//import { getUsedProps } from '../utils';


export function getUsedProps(callback: (state: any) => any): string[] {
    const props = new Set<string>();

    const createProxy = (path: string): any => {
        return new Proxy({}, {
            get(target, prop) {
                const newPath = path ? `${path}.${String(prop)}` : String(prop);
                props.add(newPath);
                return createProxy(newPath);
            }
        });
    };

    const proxy = createProxy('');
    callback(proxy);

    const propsArray = [...Array.from(props), ...getUsedPropsWithRegex(callback)];
    const finalProps = propsArray.filter(prop => !propsArray.some(other => other !== prop && other.startsWith(`${prop}.`)));

    return finalProps;
}

export function getUsedPropsWithRegex(callback: (state: any) => any): string[] {
    const callbackString = callback.toString();
    let variableNameMatch = callbackString.match(/\(\s*(\w+)/)?.[1] as string;
    if (!variableNameMatch) { return []; }
    variableNameMatch += '.';

    const regex = /(?:\w+)\s*[\.\[\]](?:[^?.]+(?:\.|\[\d+\]|\])?[^?.]*)/g;
    const matches = callbackString.match(regex);
    const len = variableNameMatch.length;
    const cleanMatches = matches?.map(match => {
        const path = match.replace(/\[\d+\]/g, match => '.' + match.slice(1, -1));

        return path.startsWith(variableNameMatch) ? path.substring(len) : '';
    });

    if (!cleanMatches) {
        return [];
    }

    return Array.from(new Set(cleanMatches));
}

describe('getUsedProps', () => {

    it('should return correct properties for a simple ternary operation', () => {
        const callback = (s: any, b: any) => s.people.secondaryAddress.state ? s.people.secondaryAddress.city : s.people.primaryAddress.city;
        const result = getUsedProps(callback as any);
        console.log(result);
        expect(result).toEqual(['people.secondaryAddress.state', 'people.secondaryAddress.city', 'people.primaryAddress.city']);
    });

    it('should return correct properties for array accesses inside an array', () => {
        const callback = (state: any) => [
            state.facts.taxableInvestments[0].text,
            state.facts.insurance[1].sumAssured
        ];
        const result = getUsedProps(callback);
        expect(result).toEqual(['facts.taxableInvestments.0.text', 'facts.insurance.1.sumAssured']);
    });

    it('should handle nested if-else conditions', () => {
        const callback = (state: any) => {
            if (state.user.isLoggedIn) {
                if (state.user.details.name) {
                    return state.user.details.name.firstName;
                } else {
                    return state.user.details.username;
                }
            } else {
                return state.user.error.message;
            }
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['user.isLoggedIn', 'user.details.name', 'user.details.name.firstName', 'user.details.username', 'user.error.message']);
    });

    it('should handle mixed datasets with objects and arrays', () => {
        const callback = (state: any) => ({
            first: state.level1.level2[0].prop,
            second: state.level1.level3.prop,
            third: state.level1.level4[2].prop
        });
        const result = getUsedProps(callback);
        expect(result).toEqual(['level1.level2.0.prop', 'level1.level3.prop', 'level1.level4.2.prop']);
    });

    it('should handle objects inside arrays', () => {
        const callback = (state: any) => [
            state.array[0].object.prop1,
            state.array[1].object.prop2
        ];
        const result = getUsedProps(callback);
        expect(result).toEqual(['array.0.object.prop1', 'array.1.object.prop2']);
    });

    it('should handle deeply nested properties with various data types', () => {
        const callback = (state: any) => {
            if (state.a.b.c.d.e.f.g) {
                return state.a.b.c.d.e.f.h.i.j;
            }
            return null;
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['a.b.c.d.e.f.g', 'a.b.c.d.e.f.h.i.j']);
    });

    it('should handle properties accessed within loops', () => {
        const callback = (state: any) => {
            const result = [];
            for (let i = 0; i < state.items.length; i++) {
                result.push(state.items[i].property);
            }
            return result;
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['items.length', 'items.0.property', 'items.1.property', 'items.2.property', 'items.3.property']);
    });

    it('should handle properties accessed within function calls', () => {
        const callback = (state: any) => {
            const utilFunc = (obj: any) => obj.value;
            return utilFunc(state.nested.object);
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['nested.object.value']);
    });

    it('should handle properties within computed values in objects', () => {
        const callback = (state: any) => ({
            computed: state.base.value + state.additional.value
        });
        const result = getUsedProps(callback);
        expect(result).toEqual(['base.value', 'additional.value']);
    });

    it('should handle multiple condition checks', () => {
        const callback = (state: any) => {
            if (state.check1 && state.check2) {
                return state.result.success;
            }
            return state.result.failure;
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['check1', 'check2', 'result.success', 'result.failure']);
    });

    it('should handle nested conditions with array access', () => {
        const callback = (state: any) => {
            if (state.a1 && state.a2.b1) {
                return state.a2.b2[0].c;
            }
            return state.a2.b2[1].c;
        };
        const result = getUsedProps(callback);
        expect(result).toEqual(['a1', 'a2.b1', 'a2.b2.0.c', 'a2.b2.1.c']);
    });

    it('should handle combination of properties and literals', () => {
        const callback = (state: any) => state.constant + state.dynamic.prop;
        const result = getUsedProps(callback);
        expect(result).toEqual(['constant', 'dynamic.prop']);
    });

    it('should handle complex object construction', () => {
        const callback = (state: any) => ({
            key1: state.object1.prop,
            key2: state.object2 ? state.object2.prop : '',
            key3: state.object3.arr[1],
            key4: state.object3.arr[2],
        });
        const result = getUsedProps(callback);
        expect(result).toEqual(['object1.prop', 'object2', 'object2.prop', 'object3.arr.1', 'object3.arr.2']);
    });

    it('should handle properties with nested ternary operations', () => {
        const callback = (state: any) => state.flag1 ? (state.flag2 ? state.value1 : state.value2) : state.value3;
        const result = getUsedProps(callback);
        expect(result).toEqual(['flag1', 'flag2', 'value1', 'value2', 'value3']);
    });

});