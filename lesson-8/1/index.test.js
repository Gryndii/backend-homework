const { validate, validateFields } = require('./');

const mock = {
  data: {
    payload: {
      name: 'name',
      email: 'email',
      password: 'password'
    },
    meta: {}
  },
  name: 'Mock',
  instance: ''
};

const testField = (fieldName) => {
  test(`Should throw appropriate error if the payload doesn't contain "${fieldName}" field`, () => {
    const data = Object.assign({}, mock);
    delete data.data.payload[fieldName];

    expect(
      () => validate(data)
    ).toThrow(`${data.name}: payload should have required field ${fieldName}`);
  });

  test(`Should throw appropriate error if "${fieldName}" is empty`, () => {
    const data = Object.assign({}, mock);
    data.data.payload[fieldName] = '';

    expect(
      () => validate(data)
    ).toThrow(`${data.name}: payload.${fieldName} should not be empty`);
  });

  test(`Should throw appropriate error if "${fieldName}" isn't a string typed`, () => {
    const data = Object.assign({}, mock);
    data.data.payload[fieldName] = 1;

    expect(
      () => validate(data)
    ).toThrow(`${data.name}: payload.${fieldName} should should be a string`);
  });
};

describe('validate function tests:', () => {
  test('Should throw appropriate error if the payload is not an object', () => {
    expect(
      () => validate({ ...mock, data: { ...mock.data, payload: '' } })
    ).toThrow(`${mock.name}: payload should be an object`);
  }); 

  testField('password');

  testField('email');

  testField('name');
});

describe('validateFields function tests:', () => {
  test(`Should throw appropriate error if data contains prohibited field`, () => {
    const data = Object.assign({}, mock);
    const prohibitedKey = 'prohibitedKey';
    data.data[prohibitedKey] = prohibitedKey;

    expect(
      () => validateFields(data)
    ).toThrow(`${data.name}: data contains not allowed field — ${prohibitedKey}`);
  });
});