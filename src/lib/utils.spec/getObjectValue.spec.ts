import { getObjectValue } from '../utils';
import { describe, test, expect } from '@jest/globals';

describe('getObjectValue', () => {

    const obj = {
        a: { b: { c: null } },
        person: {
            spouse: {
                phoneNumber: 987654321,
                address: null
            },
            self: {
                phoneNumber: 987654321,
                address: { stateCode: 'AP' }
            }
        },
        when: new Date(),
        mapExample: new Map<string, any>([
            ['key1', 'value1'],
            ['nestedMap', new Map([
                ['innerKey', 'innerValue']
            ])]
        ]),
        arrayExample: [1, { nested: 'value' }, 3]
    };

    test('getting direct property from object', () => {
        expect(getObjectValue(obj, ['person', 'self', 'phoneNumber'])).toBe(987654321);
    });

    test('getting inner property of object', () => {
        expect(getObjectValue(obj, ['person', 'self', 'address', 'stateCode'])).toBe('AP');
    });

    test('getting property from map', () => {
        expect(getObjectValue(obj, ['mapExample', 'key1'])).toBe('value1');
    });

    test('getting inner property from map', () => {
        expect(getObjectValue(obj, ['mapExample', 'nestedMap', 'innerKey'])).toBe('innerValue');
    });

    test('getting value from array', () => {
        expect(getObjectValue(obj, ['arrayExample', '0'])).toBe(1);
    });

    test('getting nested value from array', () => {
        expect(getObjectValue(obj, ['arrayExample', '1', 'nested'])).toBe('value');
    });

    test('getting value of null property', () => {
        expect(getObjectValue(obj, ['person', 'spouse', 'address'])).toBeNull();
    });

    test('getting inner most value from null property', () => {
        expect(getObjectValue(obj, ['person', 'spouse', 'address', 'stateCode'])).toBeUndefined();
    });

    test('getting inner most value from null property', () => {
        expect(getObjectValue(obj, ['person', 'spouse', 'address', 'stateCode', 'zip'])).toBeUndefined();
    });

    test('getting value of undefined property', () => {
        expect(getObjectValue(obj, ['nonexistent', 'property'])).toBeUndefined();
    });

    test('getting inner most value from undefined property', () => {
        expect(getObjectValue(obj, ['nonexistent', 'property', 'inner'])).toBeUndefined();
    });

    test('get null property', () => {
        expect(getObjectValue(obj, ['a', 'b', 'c'])).toBeNull();
    });

    test('get inner most from null property', () => {
        expect(getObjectValue(obj, ['a', 'b', 'c', 'd', 'e'])).toBeUndefined();
    });

    test('getting inner property that does not exist', () => {
        expect(getObjectValue(obj, ['a', 'b', 'x', 'y'])).toBeUndefined();
    });

    test('getting intermediate null property', () => {
        expect(getObjectValue(obj, ['person', 'spouse', 'address'])).toBeNull();
    });

    test('getting properties in array with an object', () => {
        const complexArray = [{ a: 1 }, { b: 2, c: { d: 3 } }];
        expect(getObjectValue(complexArray, ['1', 'c', 'd'])).toBe(3);
    });

    test('undefined if intermediate value is not an object', () => {
        const mixedTypes = { a: 1, b: 'test' };
        expect(getObjectValue(mixedTypes, ['b', 'c'])).toBeUndefined();
    });

    test('value from complex nested structures', () => {
        const complex = {
            level1: {
                level2: new Map([
                    ['level3', [{ id: 1, value: 'nested' }]]
                ])
            }
        };
        expect(getObjectValue(complex, ['level1', 'level2', 'level3', '0', 'value'])).toBe('nested');
    });
});