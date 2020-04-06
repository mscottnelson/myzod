import * as assert from 'assert';
import * as zod from '../src/index';

type ArgumentsType<T extends (...args: any[]) => any> = T extends (...args: (infer K)[]) => any ? K : any;

const catchError = <T extends (...args: any[]) => any>(fn: T): ((...args: ArgumentsType<T>[]) => Error) => {
  return function (...args) {
    try {
      fn(...args);
      throw new Error('expected function to throw');
    } catch (err) {
      return err;
    }
  };
};

describe('Zod Parsing', () => {
  describe('String parsing', () => {
    const schema = zod.string();

    it('should return valid string', () => {
      const ret = schema.parse('hello world');
      assert.equal(ret, 'hello world');
    });

    it('should throw a ValidationError if not a string', () => {
      const err = catchError(schema.parse.bind(schema))(123);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be string but got number');
    });

    it('should pass if matches provided pattern', () => {
      const schema = zod.string({ pattern: /^hello/ });
      assert.equal(schema.parse('hello world'), 'hello world');
    });

    it('should pass if matches provided pattern - fluent syntax', () => {
      const schema = zod.string().pattern(/^hello/);
      assert.equal(schema.parse('hello world'), 'hello world');
    });

    it('should fail if string does not match pattern', () => {
      const schema = zod.string({ pattern: /^hello/ });
      const err = catchError(schema.parse.bind(schema))('goodbye world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to match pattern /^hello/ but did not');
    });

    it('should fail if string does not match pattern - fluent syntax', () => {
      const schema = zod.string().pattern(/^hello/);
      const err = catchError(schema.parse.bind(schema))('goodbye world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to match pattern /^hello/ but did not');
    });

    it('should pass if string length is within the range', () => {
      const schema = zod.string({ min: 3, max: 6 });
      assert.equal(schema.parse('hello'), 'hello');
    });

    it('should fail if string length is less than min', () => {
      const schema = zod.string({ min: 3 });
      const err = catchError(schema.parse.bind(schema))('hi');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to have length greater than or equal to 3 but had length 2');
    });

    it('should fail if string length is less than min - fluent syntax', () => {
      const schema = zod.string().min(3);
      const err = catchError(schema.parse.bind(schema))('hi');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to have length greater than or equal to 3 but had length 2');
    });

    it('should fail if string length is greater than max', () => {
      const schema = zod.string({ max: 6 });
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to have length less than or equal to 6 but had length 11');
    });

    it('should fail if string length is greater than max - fluent syntax', () => {
      const schema = zod.string().max(6);
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to have length less than or equal to 6 but had length 11');
    });

    it('should pass if predicate function returns true', () => {
      const schema = zod.string().predicate(() => true);
      assert.equal(schema.parse('hello'), 'hello');
    });

    it('should fail if predicate function returns false', () => {
      const schema = zod.string({ predicate: () => false });
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to pass predicate function');
    });

    it('should fail if predicate function returns false - fluent syntax', () => {
      const schema = zod.string().predicate(() => false);
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected string to pass predicate function');
    });

    it('should fail with predicate error message if predicate function returns false - fluent syntax', () => {
      const schema = zod.string().predicate(() => false, 'custom predicate message');
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'custom predicate message');
    });

    it('should fail with same error message as predicate function if it throws', () => {
      const schema = zod.string().predicate(() => {
        throw new Error('predicate error message');
      });
      const err = catchError(schema.parse.bind(schema))('hello world');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'predicate error message');
    });
  });

  describe('boolean parsing', () => {
    const schema = zod.boolean();

    it('should return valid boolean', () => {
      const ret = schema.parse(false);
      assert.equal(ret, false);
    });

    it('should throw a ValidationError if not a boolean', () => {
      const err = catchError(schema.parse.bind(schema))({});
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be boolean but got object');
    });
  });

  describe('number parsing', () => {
    const schema = zod.number();

    it('should return valid number', () => {
      const ret = schema.parse(321);
      assert.equal(ret, 321);
    });

    it('should throw a ValidationError if not a number', () => {
      const err = catchError(schema.parse.bind(schema))(null);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be number but got null');
    });

    it('should succeed if number is with range', () => {
      const schema = zod.number({ min: 0, max: 10 });
      const ret = schema.parse(5);
      assert.equal(ret, 5);
    });

    it('should succeed if number is equal to min or max', () => {
      const schema = zod.number({ min: 0, max: 10 });
      assert.equal(schema.parse(0), 0);
      assert.equal(schema.parse(10), 10);
    });

    it('should fail if number is below min', () => {
      const schema = zod.number({ min: 0 });
      const err = catchError(schema.parse.bind(schema))(-1);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected number to be greater than or equal to 0 but got -1');
    });

    it('should fail if number is below min - fluent syntax', () => {
      const schema = zod.number().min(0);
      const err = catchError(schema.parse.bind(schema))(-1);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected number to be greater than or equal to 0 but got -1');
    });

    it('should fail if number is greater than max - fluent syntax', () => {
      const schema = zod.number().max(10);
      const err = catchError(schema.parse.bind(schema))(20);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected number to be less than or equal to 10 but got 20');
    });
  });

  describe('undefined parsing', () => {
    const schema = zod.undefined();

    it('should return undefined', () => {
      const ret = schema.parse(undefined);
      assert.equal(ret, undefined);
    });

    it('should throw a ValidationError if not undefined', () => {
      const err = catchError(schema.parse.bind(schema))('hello');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be undefined but got string');
    });
  });

  describe('null parsing', () => {
    const schema = zod.null();

    it('should return null', () => {
      const ret = schema.parse(null);
      assert.equal(ret, null);
    });

    it('should throw a ValidationError if not null', () => {
      const err = catchError(schema.parse.bind(schema))(123);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be null but got number');
    });
  });

  describe('literal parsing', () => {
    const schema = zod.literal('123');

    it('should return the literal if match', () => {
      const ret = schema.parse('123');
      assert.equal(ret, '123');
    });

    it('should throw a ValidationError if not the same type', () => {
      const err = catchError(schema.parse.bind(schema))(123);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, `expected value to be literal "123" but got 123`);
    });

    it('should throw validation error if literal is not the same value', () => {
      const err = catchError(schema.parse.bind(schema))('321');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, `expected value to be literal "123" but got "321"`);
    });
  });

  describe('unknown parsing', () => {
    it('should return the unknown value as is', () => {
      const schema = zod.unknown();
      const ret = schema.parse('hello');
      assert.equal(ret, 'hello');
    });

    it('should force a key to be required within an object schema', () => {
      const schema = zod.object({ required: zod.unknown() });
      const err = catchError(schema.parse.bind(schema))({});
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        `error parsing object at path: "required" - expected key "required" of unknown type to be present on object`
      );
    });

    it('should force a key to be required within an object schema even if key value is undefined', () => {
      const schema = zod.object({ required: zod.unknown() });
      const ret = schema.parse({ required: undefined });
      assert.deepEqual(ret, { required: undefined });
      assert.equal(ret.hasOwnProperty('required'), true);
    });
  });

  describe('optional and nullable modifiers', () => {
    const optionalSchema = zod.string().optional();
    const nullableSchema = zod.string().nullable();

    it('should accept undefined as a value when optional schema', () => {
      const ret = optionalSchema.parse(undefined);
      assert.equal(ret, undefined);
    });

    it('should accept null as a value when nullable schema', () => {
      const ret = nullableSchema.parse(null);
      assert.equal(ret, null);
    });

    it('should not allow null when optional schema', () => {
      const err = catchError(optionalSchema.parse.bind(optionalSchema))(null);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'No union satisfied:\n  expected type to be string but got null\n  expected type to be undefined but got null'
      );
    });

    it('should not allow undefined when nullable schema', () => {
      const err = catchError(nullableSchema.parse.bind(nullableSchema))(undefined);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'No union satisfied:\n  expected type to be string but got undefined\n  expected type to be null but got undefined'
      );
    });
  });

  describe('object parsing', () => {
    const emptySchema = zod.object({});
    it('should only accept empty object', () => {
      const ret = emptySchema.parse({});
      assert.deepEqual(ret, {});
    });

    it('should fail if value provided is null', () => {
      const err = catchError(emptySchema.parse.bind(emptySchema))(null);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected object but got null');
    });

    it('should fail if value provided is an array', () => {
      const err = catchError(emptySchema.parse.bind(emptySchema))([]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be regular object but got array');
    });

    it('should fail if there are unknown keys', () => {
      const err = catchError(emptySchema.parse.bind(emptySchema))({ key: 'unkown', value: 'unknown' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["key","value"]');
    });

    it('should allow unknown keys', () => {
      const ret = emptySchema.parse({ a: 1 }, { allowUnknown: true });
      assert.deepEqual(ret, { a: 1 });
    });

    it('should return object with correct object shape - simple', () => {
      const schema = zod.object({ name: zod.string() });
      const ret = schema.parse({ name: 'Bobby' });
      assert.deepEqual(ret, { name: 'Bobby' });
    });

    it('should allow omitted properties on optional keys but include them in returned object', () => {
      const schema = zod.object({
        name: zod.string(),
        age: zod.number().optional(),
      });
      const ret = schema.parse({ name: 'Bobby Darrin' });
      assert.deepEqual(ret, { name: 'Bobby Darrin' });
    });

    it('should fail if object has wrong shape', () => {
      const schema = zod.object({ name: zod.string() });
      const err = catchError(schema.parse.bind(schema))({ name: 5 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "name" - expected type to be string but got number');
      assert.equal((err as zod.ValidationError).path, 'name');
    });

    it('should give meaningful error for nested objects errors', () => {
      const schema = zod.object({ person: zod.object({ name: zod.string() }) });
      const topLevelError = catchError(schema.parse.bind(schema))({ person: 5 });
      assert.equal(topLevelError instanceof zod.ValidationError, true);
      assert.equal(
        topLevelError.message,
        'error parsing object at path: "person" - expected type to be object but got number'
      );
      assert.equal((topLevelError as zod.ValidationError).path, 'person');

      const nestedError = catchError(schema.parse.bind(schema))({ person: { name: 5 } });
      assert.equal(nestedError instanceof zod.ValidationError, true);
      assert.equal(
        nestedError.message,
        'error parsing object at path: "person.name" - expected type to be string but got number'
      );
      assert.deepEqual((nestedError as zod.ValidationError).path, ['person', 'name']);
    });

    it('should give meaningful path error for errors occuring within array', () => {
      const carSchema = zod.object({
        make: zod.string(),
        year: zod.number(),
      });
      const friendSchema = zod.object({
        cars: zod.array(carSchema),
      });
      const personSchema = zod.object({ friends: zod.array(friendSchema) });
      const schema = zod.object({ person: personSchema });

      const err = catchError(schema.parse.bind(schema))({
        person: {
          friends: [
            { cars: [{ make: 'toyota', year: 1996 }] },
            {
              cars: [
                { make: 'hyundai', year: 2000 },
                { make: 'kia', year: '2003' }, // error is here on the year
              ],
            },
          ],
        },
      });

      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'error parsing object at path: "person.friends[1].cars[1].year" - expected type to be number but got string'
      );
      assert.deepEqual((err as zod.ValidationError).path, ['person', 'friends', 1, 'cars', 1, 'year']);
    });
  });

  describe('record parsing', () => {
    it('should pass for a record of primitive type', () => {
      const schema = zod.record(zod.string());
      const ret = schema.parse({ a: 'hello', b: 'world' });
      assert.deepEqual(ret, { a: 'hello', b: 'world' });
    });

    it('should fail if value to be parsed is not a record/object', () => {
      const schema = zod.record(zod.boolean());
      const err = catchError(schema.parse.bind(schema))('i am a string');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be object but got string');
    });

    it('should pass if all values in object match type', () => {
      const schema = zod.record(zod.boolean());
      const ret = schema.parse({ a: true, b: false });
      assert.deepEqual(ret, { a: true, b: false });
    });

    it('should fail if a value in object does not match the type', () => {
      const schema = zod.record(zod.boolean());
      const err = catchError(schema.parse.bind(schema))({ a: 'true', b: false });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing record at path "a" - expected type to be boolean but got string');
    });

    it('should give meaningful error messages for object records with nested errors', () => {
      const schema = zod.record(zod.object({ a: zod.object({ b: zod.boolean() }) }));
      const err = catchError(schema.parse.bind(schema))({ key: { a: { b: 'hello' } } });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing record at path "key.a.b" - expected type to be boolean but got string');
      assert.deepEqual((err as zod.ValidationError).path, ['key', 'a', 'b']);
    });

    it('should fail if a key is present on object but value is undefined', () => {
      const schema = zod.record(zod.boolean());
      const err = catchError(schema.parse.bind(schema))({ a: undefined, b: false });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing record at path "a" - expected type to be boolean but got undefined');
    });

    it('should pass if a key is present on object but value is undefined if using dictionary', () => {
      const schema = zod.dictionary(zod.boolean());
      const ret = schema.parse({ a: undefined, b: false });
      assert.deepEqual(ret, { a: undefined, b: false });
    });

    it('should pass for record of partial objects', () => {
      const schema = zod.record(zod.partial(zod.object({ a: zod.string(), b: zod.string() })));
      const ret = schema.parse({
        key1: { a: 'hello', b: 'world' },
        key2: { a: 'hello' },
        key3: {},
      });
      assert.deepEqual(ret, {
        key1: { a: 'hello', b: 'world' },
        key2: { a: 'hello' },
        key3: {},
      });
    });
  });

  describe('array parsing', () => {
    it('should pass when given an empty array', () => {
      const schema = zod.array(zod.number());
      const ret = schema.parse([]);
      assert.deepEqual(ret, []);
    });

    it('should pass when given an array with elements that match type', () => {
      const schema = zod.array(zod.number());
      const ret = schema.parse([1, 2, 3]);
      assert.deepEqual(ret, [1, 2, 3]);
    });

    it('should fail if not given an array', () => {
      const schema = zod.array(zod.string());
      const err = catchError(schema.parse.bind(schema))({ 0: 'first', 1: 'second', length: 2 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected an array but got object');
    });

    it('should fail if an array element does not match schema', () => {
      const schema = zod.array(zod.string());
      const err = catchError(schema.parse.bind(schema))(['hello', 123]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error at [1] - expected type to be string but got number');
      assert.deepEqual((err as zod.ValidationError).path, [1]);
    });

    it('should pass if array has provided length', () => {
      const schema = zod.array(zod.string(), { length: 2 });
      const ret = schema.parse(['hello', 'world']);
      assert.deepEqual(ret, ['hello', 'world']);
    });

    it('should pass if array has provided length - fluent syntax', () => {
      const schema = zod.array(zod.string()).length(2);
      const ret = schema.parse(['hello', 'world']);
      assert.deepEqual(ret, ['hello', 'world']);
    });

    it('should fail if array does not have provided length', () => {
      const schema = zod.array(zod.string()).length(2);
      const err = catchError(schema.parse.bind(schema))([]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected array to have length 2 but got 0');
    });

    it('should pass if array has length falls within range', () => {
      const schema = zod.array(zod.number(), { min: 2, max: 2 });
      const ret = schema.parse([1, 2]);
      assert.deepEqual(ret, [1, 2]);
    });

    it('should pass if array has length falls within range - fluent syntax', () => {
      const schema = zod.array(zod.number()).min(2).max(2);
      const ret = schema.parse([1, 2]);
      assert.deepEqual(ret, [1, 2]);
    });

    it('should fail if array length is less than min', () => {
      const schema = zod.array(zod.number(), { min: 2 });
      const err = catchError(schema.parse.bind(schema))([]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected array to have length greater than or equal to 2 but got 0');
    });

    it('should fail if array length is greater than max', () => {
      const schema = zod.array(zod.number(), { max: 1 });
      const err = catchError(schema.parse.bind(schema))([1, 2]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected array to have length less than or equal to 1 but got 2');
    });

    it('should pass if elements are unique', () => {
      const schema = zod.array(zod.number(), { unique: true });
      const ret = schema.parse([1, 2, 3]);
      assert.deepEqual(ret, [1, 2, 3]);
    });

    it('should fail if elements are not unique', () => {
      const schema = zod.array(zod.number(), { unique: true });
      const err = catchError(schema.parse.bind(schema))([1, 2, 2]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected array to be unique but found same element at indexes 1 and 2');
    });

    it('should fail if elements are not unique - fluent syntax', () => {
      const schema = zod.array(zod.number()).unique();
      const err = catchError(schema.parse.bind(schema))([1, 2, 2]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected array to be unique but found same element at indexes 1 and 2');
    });

    it('should give meaningful path error for objects', () => {
      const schema = zod.array(zod.object({ key: zod.number() }));
      const err = catchError(schema.parse.bind(schema))([{ key: '123' }, { key: 321 }]);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error at [0].key - expected type to be number but got string');
      assert.deepEqual((err as zod.ValidationError).path, [0, 'key']);
    });
  });

  describe('union parsing', () => {
    it('should pass for every type inside of a union', () => {
      const schema = zod.union([
        zod.string(),
        zod.boolean(),
        zod.number(),
        zod.undefined(),
        zod.null(),
        zod.object({}),
        zod.array(zod.number()),
      ]);

      schema.parse('hello');
      schema.parse(true);
      schema.parse(123);
      schema.parse(undefined);
      schema.parse(null);
      schema.parse({});
      schema.parse([]);
    });

    it('should fail if type does not match any schema inside of union', () => {
      const schema = zod.union([zod.string(), zod.number()]);
      const err = catchError(schema.parse.bind(schema))(true);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'No union satisfied:\n  expected type to be string but got boolean\n  expected type to be number but got boolean'
      );
    });

    it('should fail for the union of objects if value not strictly one or the other', () => {
      const schema = zod.union([
        zod.object({ a: zod.string() }),
        zod.object({ b: zod.number() }),
        zod.object({ c: zod.boolean() }),
      ]);
      const err = catchError(schema.parse.bind(schema))({ a: 'string', b: 123, c: false });
      assert.equal(err instanceof zod.ValidationError, true);

      const expectedSubMessages = [
        'unexpected keys on object: ["b","c"]',
        'unexpected keys on object: ["a","c"]',
        'unexpected keys on object: ["a","b"]',
      ];
      assert.equal(err.message, 'No union satisfied:\n  ' + expectedSubMessages.join('\n  '));
    });

    it('should pass for the union of objects when strict is false and value subclasses one type', () => {
      const schema = zod.union(
        [zod.object({ a: zod.string() }), zod.object({ b: zod.number() }), zod.object({ c: zod.boolean() })],
        { strict: false }
      );
      const ret = schema.parse({ a: 'string', b: 123, c: false });
      assert.deepEqual(ret, { a: 'string', b: 123, c: false });
    });
  });

  describe('intersection parsing', () => {
    it('should pass if value is the intersection of both object types', () => {
      const schema = zod.intersection(zod.object({ a: zod.string() }), zod.object({ b: zod.number() }));
      const ret = schema.parse({ a: 'hello', b: 123 });
      assert.deepEqual(ret, { a: 'hello', b: 123 });
    });

    it('should fail if value is not the intersection of both object types', () => {
      const schema = zod.intersection(zod.object({ a: zod.string() }), zod.object({ b: zod.number() }));
      const err = catchError(schema.parse.bind(schema))({ a: 'hello' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "b" - expected type to be number but got undefined');
    });

    it('should fail if value has unknown keys to the intersection of both object types', () => {
      const schema = zod.intersection(zod.object({ a: zod.string() }), zod.object({ b: zod.number() }));
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 3, c: true, d: false });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object ["c","d"]');
    });

    it('should reduce union types to their interseciton', () => {
      const schema = zod.intersection(zod.string(), zod.string().nullable());
      const ret = schema.parse('string');
      assert.equal(ret, 'string');

      const err = catchError(schema.parse.bind(schema))(null);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be string but got null');
    });

    it('should intersect a record an object such that the object fields have precedence over the record', () => {
      const schema = zod.intersection(zod.object({ a: zod.string() }), zod.record(zod.number()));
      const ret = schema.parse({ a: 'hello', b: 3 });
      assert.deepEqual(ret, { a: 'hello', b: 3 });
    });

    it('should fail the record and object intersection does not respect the object shape', () => {
      const schema = zod.intersection(zod.object({ a: zod.string() }), zod.record(zod.number()));
      const err = catchError(schema.parse.bind(schema))({ a: 2, b: 3 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be string but got number');
    });

    it('should pass if key values in object respects record intersection', () => {
      const recordA = zod.record(zod.object({ a: zod.number() }));
      const recordB = zod.record(zod.object({ b: zod.string() }));
      const schema = zod.intersection(recordA, recordB);
      const ret = schema.parse({ key: { a: 2, b: 'hello' } });
      assert.deepEqual(ret, { key: { a: 2, b: 'hello' } });
    });

    it('should fail if key values in object do satisfy record intersection', () => {
      const recordA = zod.record(zod.object({ a: zod.number() }));
      const recordB = zod.record(zod.object({ b: zod.string() }));
      const schema = zod.intersection(recordA, recordB);
      const err = catchError(schema.parse.bind(schema))({ key: { a: 2 } });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing record at path "key.b" - expected type to be string but got undefined');
    });

    it('should fail if the value contains object keys not in Record<object> intersection', () => {
      const recordA = zod.record(zod.object({ a: zod.number() }));
      const recordB = zod.record(zod.object({ b: zod.string() }));
      const schema = zod.intersection(recordA, recordB);
      const err = catchError(schema.parse.bind(schema))({ key: { a: 2, b: 'string', c: true } });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing record at path "key" - unexpected keys on object ["c"]');
    });

    it('should parse the intersection of partials objects', () => {
      const schema = zod.intersection(
        zod.partial(zod.object({ a: zod.string() })),
        zod.partial(zod.object({ b: zod.number() }))
      );
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail if intersection of partial types is not respected', () => {
      const schema = zod.intersection(
        zod.partial(zod.object({ a: zod.string() })),
        zod.partial(zod.object({ b: zod.number() }))
      );
      const err = catchError(schema.parse.bind(schema))({ a: 3 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'error parsing object at path: "a" - No union satisfied:\n  expected type to be string but got number\n  expected type to be undefined but got number'
      );
    });

    it('should intersect two picked types', () => {
      const schemaA = zod.pick(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.pick(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const ret = schema.parse({ a: 'hello', b: 123 });
      assert.deepEqual(ret, { a: 'hello', b: 123 });
    });

    it('should fail if unknown key is present of intersect of two picked types', () => {
      const schemaA = zod.pick(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.pick(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 123, c: 'patate' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object ["c"]');
    });

    it('should fail if key is missing from intersect of two picked types', () => {
      const schemaA = zod.pick(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.pick(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ b: 123 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be string but got undefined');
    });

    it('should intersect two omit types', () => {
      const schemaA = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.omit(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const ret = schema.parse({ a: 123, b: 'hello' });
      assert.deepEqual(ret, { a: 123, b: 'hello' });
    });

    it('should fail if unknown key in intersect of two omit types', () => {
      const schemaA = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.omit(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ a: 123, b: 'hello', c: 'patate' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object ["c"]');
    });

    it('should fail if missing key in intersect of two omit types', () => {
      const schemaA = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.omit(zod.object({ a: zod.number(), b: zod.number() }), ['b']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ b: 'hello' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be number but got undefined');
    });

    it('should intersect a pick and an omit', () => {
      const schemaA = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.pick(zod.object({ a: zod.number(), b: zod.number() }), ['a']);
      const schema = schemaA.and(schemaB);
      const ret = schema.parse({ a: 123, b: 'hello' });
      assert.deepEqual(ret, { a: 123, b: 'hello' });
    });

    it('should fail if unknown key in intersect of pick and omit types', () => {
      const schemaA = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.pick(zod.object({ a: zod.number(), b: zod.number() }), ['a']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ a: 123, b: 'hello', c: 'patate' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object ["c"]');
    });

    it('should fail if missing key in intersect of pick and omit types', () => {
      const schemaA = zod.pick(zod.object({ a: zod.string(), b: zod.string() }), ['a']);
      const schemaB = zod.omit(zod.object({ a: zod.number(), b: zod.number() }), ['a']);
      const schema = schemaA.and(schemaB);
      const err = catchError(schema.parse.bind(schema))({ b: 'hello' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be string but got undefined');
    });
  });

  describe('enum parsing', () => {
    enum Colors {
      red = 'red',
      blue = 'blue',
      green = 'green',
    }
    const schema = zod.enum(Colors);

    it('should pass if value is part of enum', () => {
      assert.equal(schema.parse('red'), Colors.red);
    });

    it('should fail if not part of enum', () => {
      const err = catchError(schema.parse.bind(schema))('hot fuzz');
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error "hot fuzz" not part of enum values');
    });

    it('should return true if value satisfies enum', () => {
      assert.equal(schema.check('green'), true);
    });

    it('should return false if value satisfies enum', () => {
      assert.equal(schema.check('blueberry'), false);
    });
  });

  describe('partial parsing', () => {
    it('should have no effect on a primitive type', () => {
      const schema = zod.partial(zod.string());
      assert.equal(schema.parse('hello'), 'hello');

      const err = catchError(schema.parse.bind(schema))(undefined);
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'expected type to be string but got undefined');
    });

    it('should make an object keys optional', () => {
      const schema = zod.partial(zod.object({ a: zod.string(), b: zod.boolean() }));
      const ret = schema.parse({});
      assert.deepEqual(ret, {});
    });

    it('should not lose any validation definitions', () => {
      const schema = zod.partial(zod.object({ a: zod.string().pattern(/hello/) }));
      const err = catchError(schema.parse.bind(schema))({ a: 'hey' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(
        err.message,
        'error parsing object at path: "a" - No union satisfied:\n  expected string to match pattern /hello/ but did not\n  expected type to be undefined but got string'
      );
    });

    it('should make arrays become "holey" with undefined', () => {
      const schema = zod.partial(zod.array(zod.string()));
      const ret = schema.parse(['hello', undefined, 'world']);
      assert.deepEqual(ret, ['hello', undefined, 'world']);
    });

    it('should make object intersection keys optional', () => {
      const schemaA = zod.object({ a: zod.string() });
      const schemaB = zod.object({ b: zod.boolean() });
      const schema = zod.partial(schemaA.and(schemaB));
      assert.deepEqual(schema.parse({}), {});
    });

    it('should fail if unknown keys of partial object intersection', () => {
      const schemaA = zod.object({ a: zod.string() });
      const schemaB = zod.object({ b: zod.boolean() });
      const schema = zod.partial(schemaA.and(schemaB));
      const err = catchError(schema.parse.bind(schema))({ d: 'hey' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object ["d"]');
    });

    it('should make the values of a record optional', () => {
      const schema = zod.partial(zod.record(zod.number()));
      const ret = schema.parse({ a: 3, b: undefined });
      assert.deepEqual(ret, { a: 3, b: undefined });
    });

    xit('should pass with empty object for object unions partial', () => {
      const schema = zod.partial(zod.object({ a: zod.number() }).or(zod.object({ b: zod.string() })));
      assert.deepEqual(schema.parse({}), { a: undefined, b: undefined });
    });
  });

  describe('pick parsing', () => {
    it('should pass if picked object type is satisfied', () => {
      const schema = zod.pick(zod.object({ a: zod.number(), b: zod.string() }), ['a']);
      const ret = schema.parse({ a: 1 });
      assert.deepEqual(ret, { a: 1 });
    });

    it('should fail if value contains all keys and not only picked ones from picked object', () => {
      const schema = zod.pick(zod.object({ a: zod.number(), b: zod.string() }), ['a']);
      const err = catchError(schema.parse.bind(schema))({ a: 1, b: 'hello' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should fail if value is missing properties from picked object', () => {
      const schema = zod.pick(zod.object({ a: zod.number(), b: zod.string() }), ['a']);
      const err = catchError(schema.parse.bind(schema))({});
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be number but got undefined');
    });

    it('should pass if picked record type is satisfied', () => {
      const schema = zod.pick(zod.record(zod.number()), ['a', 'b']);
      const ret = schema.parse({ a: 1, b: 2 });
      assert.deepEqual(ret, { a: 1, b: 2 });
    });

    it('should fail if keys not part of the pick in from the record', () => {
      const schema = zod.pick(zod.record(zod.number()), ['a', 'b']);
      const err = catchError(schema.parse.bind(schema))({ a: 1, b: 2, c: 3 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["c"]');
    });

    it('should fail if value is missing properties from picked record', () => {
      const schema = zod.pick(zod.record(zod.number()), ['a', 'b']);
      const err = catchError(schema.parse.bind(schema))({ a: 1 });
      assert.equal(err instanceof zod.ValidationError, true, 'Did not throw ValidationError');
      assert.equal(err.message, 'error parsing record at path "b" - expected type to be number but got undefined');
    });

    it('should pass if picked object intersection type is satisfied', () => {
      const schema = zod.pick(zod.object({ a: zod.number() }).and(zod.object({ b: zod.string() })), ['a']);
      const ret = schema.parse({ a: 1 });
      assert.deepEqual(ret, { a: 1 });
    });

    it('should pass if value contains all keys and not only picked ones from object intersection', () => {
      const schema = zod.pick(zod.object({ a: zod.number() }).and(zod.object({ b: zod.string() })), ['a']);
      const err = catchError(schema.parse.bind(schema))({ a: 1, b: 'hello' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should fail if value is missing properties from picked object intersection', () => {
      const schema = zod.pick(zod.object({ a: zod.number() }).and(zod.object({ b: zod.string() })), ['a']);
      const err = catchError(schema.parse.bind(schema))({});
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'error parsing object at path: "a" - expected type to be number but got undefined');
    });

    it('should fail on construction of primitive schema if root is primitive', () => {
      // @ts-ignore
      for (const type of [zod.string, zod.boolean, zod.undefined, zod.unknown, zod.null, zod.number]) {
        const err = catchError(zod.pick)(type(), ['a']);
        assert.equal(err.message, 'cannot instantiate a PickType with a primitive schema');
      }
    });

    it('should fail on construction of intesection of primitive schemas', () => {
      const err = catchError(zod.pick)(zod.string().and(zod.string().optional()), ['a']);
      assert.equal(err.message, 'cannot instantiate a PickType with a primitive schema');
    });

    it('should fail on construction of union of only primitive schemas', () => {
      const err = catchError(zod.pick)(zod.string().or(zod.boolean()).or(zod.number()), []);
      assert.equal(err.message, 'cannot instantiate a PickType with a primitive schema');
    });

    it('should pass for pick of pick', () => {
      const schema = zod.pick(
        zod.pick(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a', 'b']
        ),
        ['a']
      );
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail for pick of pick if keys outside of picked are present', () => {
      const schema = zod.pick(
        zod.pick(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a', 'b']
        ),
        ['a']
      );
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world', c: 'yo' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b","c"]');
    });

    it('should pass for pick of omitted object', () => {
      const schema = zod.pick(
        zod.omit(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['c']
        ),
        ['a']
      );
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail for pick of omitted object', () => {
      const schema = zod.pick(
        zod.omit(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['c']
        ),
        ['a']
      );
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world', c: 'yo' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b","c"]');
    });
  });

  describe('omit parsing', () => {
    it('should fail on construction of primitive schema if root is primitive', () => {
      // @ts-ignore
      for (const type of [zod.string, zod.boolean, zod.undefined, zod.unknown, zod.null, zod.number]) {
        const err = catchError(zod.omit)(type(), ['a']);
        assert.equal(err.message, 'cannot instantiate a OmitType with a primitive schema');
      }
    });

    it('should fail on construction of intesection of primitive schemas', () => {
      const err = catchError(zod.omit)(zod.string().and(zod.string().optional()), ['a']);
      assert.equal(err.message, 'cannot instantiate a OmitType with a primitive schema');
    });

    it('should fail on construction of union of only primitive schemas', () => {
      const err = catchError(zod.omit)(zod.string().or(zod.boolean()).or(zod.number()), []);
      assert.equal(err.message, 'cannot instantiate a OmitType with a primitive schema');
    });

    it('should pass if value satisfies schema and omits indicated keys', () => {
      const schema = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['b']);
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail if value does not omit indicated key', () => {
      const schema = zod.omit(zod.object({ a: zod.string(), b: zod.string() }), ['b']);
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should pass when value omit key from object intersection', () => {
      const schema = zod.omit(zod.object({ a: zod.string() }).and(zod.object({ b: zod.string() })), ['b']);
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should pass if record does not contain omitted fields', () => {
      const schema = zod.omit(zod.record(zod.string()), ['b']);
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail if record does contain omitted fields', () => {
      const schema = zod.omit(zod.record(zod.string()), ['b']);
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should fail key is in record intersection', () => {
      const schema = zod.omit(
        zod.record(zod.object({ a: zod.string() }).and(zod.record(zod.object({ b: zod.string() })))),
        ['b']
      );
      const err = catchError(schema.parse.bind(schema))({
        a: { a: 'hello', b: 'world' },
        b: { a: 'hello', b: 'world' },
      });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should pass if omitted key is not present in record of object intersection', () => {
      const record = zod.record(zod.string());
      const obj = zod.object({ b: zod.number() });
      const intersec = record.and(obj);
      const schema = zod.omit(intersec, ['b']);
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });

    it('should fail if key is present in record object intersection', () => {
      const schema = zod.omit(zod.record(zod.string()).and(zod.object({ b: zod.number() })), ['b']);
      const err = catchError(schema.parse.bind(schema))({ b: 123 });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should omit a key from a picked type', () => {
      const schema = zod.omit(
        zod.pick(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a', 'b']
        ),
        ['b']
      );
      const ret = schema.parse({ a: 'hello' });
      assert.deepEqual(ret, { a: 'hello' });
    });
    it('should fail if key is present in the omit of a picked type', () => {
      const schema = zod.omit(
        zod.pick(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a', 'b']
        ),
        ['b']
      );
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world', c: 'yolo' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });

    it('should work for omit of omit', () => {
      const schema = zod.omit(
        zod.omit(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a']
        ),
        ['b']
      );
      const ret = schema.parse({ c: 'hello' });
      assert.deepEqual(ret, { c: 'hello' });
    });

    it('should fail for omit of omit if omitted keys are preset', () => {
      const schema = zod.omit(
        zod.omit(
          zod.object({
            a: zod.string(),
            b: zod.string(),
            c: zod.string(),
          }),
          ['a']
        ),
        ['b']
      );
      const err = catchError(schema.parse.bind(schema))({ a: 'hello', b: 'world', c: 'yolo' });
      assert.equal(err instanceof zod.ValidationError, true);
      assert.equal(err.message, 'unexpected keys on object: ["b"]');
    });
  });
});