import { setObjectValue } from '../utils';

describe('setObjectValue', () => {
    test('modify nested object property', () => {
        const obj = { person: { spouse: { phoneNumber: 987654321, address: null }, self: { phoneNumber: 987654321, address: { stateCode: 'AP' } } }, when: new Date() };
        const newObj = setObjectValue(obj, ['person', 'spouse', 'address', 'stateCode'], 'TN');

        expect(newObj.person).not.toBe(obj.person);
        expect(newObj.person.spouse).not.toBe(obj.person.spouse);
        expect(newObj.person.spouse.address).not.toBe(obj.person.spouse.address);
        expect(newObj.person.self).toBe(obj.person.self);
        expect(newObj.person.spouse.address.stateCode).toBe('TN');
    });

    test('add property to a non-existing path', () => {
        const obj = { a: { b: { c: 1 } } };
        const newObj = setObjectValue(obj, ['a', 'b', 'd'], 2);

        expect(newObj.a.b).not.toBe(obj.a.b);
        expect(newObj.a.b.d).toBe(2);
    });

    test('handle null property', () => {
        const obj = { a: { b: { c: null } } };
        const newObj = setObjectValue(obj, ['a', 'b', 'c', 'd'], 3);

        expect(newObj.a.b).not.toBe(obj.a.b);
        expect(newObj.a.b.c).not.toBe(obj.a.b.c);
        expect(newObj.a.b.c.d).toBe(3);
    });

    test('modify property in nested array', () => {
        const obj = { a: [{ b: { c: 1 } }] };
        const newObj = setObjectValue(obj, ['a', '0', 'b', 'c'], 2);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a[0]).not.toBe(obj.a[0]);
        expect(newObj.a[0].b.c).toBe(2);
    });

    test('handle map property', () => {
        const obj = { a: new Map([['b', { c: 1 }]]) };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], 2);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.get('b')).not.toBe(obj.a.get('b'));
        expect(newObj.a.get('b').c).toBe(2);
        expect(obj.a.get('b')?.c).toBe(1);
    });

    test('handle deeply nested properties in array', () => {
        const obj: any = { a: [{ b: [{ c: 1 }] }] };
        const newObj = setObjectValue(obj, ['a', '0', 'b', '0', 'c'], 2);

        expect(newObj).not.toBe(obj);
        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a[0]).not.toBe(obj.a[0]);
        expect(newObj.a[0].b).not.toBe(obj.a[0].b);
        expect(newObj.a[0].b[0]).not.toBe(obj.a[0].b[0]);
        expect(newObj.a[0].b[0].c).toBe(2);
    });

    test('handle undefined property', () => {
        const obj = { a: { b: undefined } };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], 3);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.b).not.toBe(obj.a.b);
        expect((newObj.a.b as any).c).toBe(3);
    });

    test('handle non-object property type', () => {
        const obj = { a: 1 };
        const newObj = setObjectValue(obj, ['a', 'b'], 2);

        expect(newObj.a).not.toBe(obj.a);
        expect((newObj.a as any).b).toBe(2);
    });

    test('delete nested object property when value is undefined', () => {
        const obj = { a: { b: { c: 1 } } };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.b).not.toBe(obj.a.b);
        expect(newObj.a.b.hasOwnProperty('c')).toBe(false);
        expect(obj.a.b.c).toBe(1); // Original object should remain unchanged
    });

    test('handle deletion in array when value is undefined', () => {
        const obj = { a: [{ b: 1 }] };
        const newObj = setObjectValue(obj, ['a', '0', 'b'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a[0]).not.toBe(obj.a[0]);
        expect(newObj.a[0].hasOwnProperty('b')).toBe(false);
        expect(obj.a[0].b).toBe(1); // Original object should remain unchanged
    });

    test('handle deletion in map when value is undefined', () => {
        const obj = { a: new Map([['b', { c: 1 }]]) };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.get('b')).not.toBe(obj.a.get('b'));
        expect(newObj.a.get('b').hasOwnProperty('c')).toBe(false);
        expect(obj.a.get('b')?.c).toBe(1); // Original object should remain unchanged
    });

    test('delete top-level property when value is undefined', () => {
        const obj = { a: { b: 1 } };
        const newObj = setObjectValue(obj, ['a'], undefined);

        expect(newObj.hasOwnProperty('a')).toBe(false);
        expect(obj.a.b).toBe(1); // Original object should remain unchanged
    });

    test('do not recreate object if undefined value is passed to non-existing property', () => {
        const obj = { a: { b: { c: {} } } };
        const newObj = setObjectValue(obj, ['a', 'b', 'c', 'd'], undefined);

        expect(newObj).toBe(obj); // Since no changes, newObj should be the same as obj
    });

    test('do not recreate array item if undefined value is passed to non-existing property', () => {
        const obj = { a: [{ b: 1 }] };
        const newObj = setObjectValue(obj, ['a', '0', 'c'], undefined);

        expect(newObj).toBe(obj); // Since no changes, newObj should be the same as obj
    });

    test('do not recreate map entry if undefined value is passed to non-existing property', () => {
        const obj = { a: new Map([['b', { c: 1 }]]) };
        const newObj = setObjectValue(obj, ['a', 'b', 'd'], undefined);

        expect(newObj).toBe(obj); // Since no changes, newObj should be the same as obj
    });

    test('delete nested object property when value is undefined', () => {
        const obj = { a: { b: { c: 1 } } };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.b).not.toBe(obj.a.b);
        expect(newObj.a.b.hasOwnProperty('c')).toBe(false);
        expect(obj.a.b.c).toBe(1); // Original object should remain unchanged
    });

    test('handle deletion in array when value is undefined', () => {
        const obj = { a: [{ b: 1 }] };
        const newObj = setObjectValue(obj, ['a', '0', 'b'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a[0]).not.toBe(obj.a[0]);
        expect(newObj.a[0].hasOwnProperty('b')).toBe(false);
        expect(obj.a[0].b).toBe(1); // Original object should remain unchanged
    });

    test('handle deletion in map when value is undefined', () => {
        const obj = { a: new Map([['b', { c: 1 }]]) };
        const newObj = setObjectValue(obj, ['a', 'b', 'c'], undefined);

        expect(newObj.a).not.toBe(obj.a);
        expect(newObj.a.get('b')).not.toBe(obj.a.get('b'));
        expect(newObj.a.get('b').hasOwnProperty('c')).toBe(false);
        expect(obj.a.get('b')?.c).toBe(1); // Original object should remain unchanged
    });

    test('delete top-level property when value is undefined', () => {
        const obj = { a: { b: 1 } };
        const newObj = setObjectValue(obj, ['a'], undefined);

        expect(newObj.hasOwnProperty('a')).toBe(false);
        expect(obj.a.b).toBe(1); // Original object should remain unchanged
    });
});