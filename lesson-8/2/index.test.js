const { Bank } = require('./');

jest.mock('events');

describe('Bank tests: ', () => {
  test('Should throw appropriate error if customer exists', () => {
    const bank = new Bank();
    const customer = { name: 'customer' };

    bank.register(customer);
    bank.register(customer);

    expect(
      bank.emit
    ).toBeCalledWith('error', new Error(`duplicated customer for name: '${customer.name}'`));
  });

  test('Should throw appropriate error if wrong amount enrols', () => {
    const bank = new Bank();
    const customer = { name: 'customer', balance: 0 };
    const customerId = bank.register(customer);
    
    bank._enroll(customerId, -4);

    expect(
      bank.emit
    ).toBeCalledWith('error', new Error('amount should be grater than 0'));
  });
});