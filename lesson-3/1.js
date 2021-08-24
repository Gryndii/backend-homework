const EventEmitter = require('events');

class Bank extends EventEmitter {
  #clients = [];

  constructor() {
    super();
    this.on('add', this.#onAdd);
    this.on('get', this.#onGet);
    this.on('withdraw', this.#onWithdraw);
    this.on('error', this.#onError);
  }

  register(client) {
    this.#validateRegister(client);
    
    const id = this.#generateId();

    this.#clients.push({...client, id });

    return id;
  }

  #onAdd(id, amount) {
    this.#validateOnAdd(id, amount);

    const client = this.#clients.find(client => client.id === id);

    client.balance += amount;
  }

  #onGet(id, cb) {
    this.#validateOnGet(id, cb);

    const { balance } = this.#clients.find(client => client.id === id);

    cb(balance);
  }

  #onWithdraw(id, amount) {
    this.#validateOnWithdraw(id, amount);

    const client = this.#clients.find(client => client.id === id);

    client.balance -= amount;
  }

  #onError(message) {
    console.log(`Error: ${message}`);    
    throw new Error(message);
  }

  #generateId() {
    const id = 'id' + Math.random().toString(16).slice(2);
    const notUnique = this.#clients.some(client => client.id === id);
    
    return notUnique ? this.#generateId() : id;
  }

  #throwError(message) {
    this.emit('error', message);
  }

  #validateRegister({ name, balance }) {
    const hasValidName = name && !this.#clients.some(client => client.name === name);
    const hasValidBalance = balance > 0;

    if(!hasValidName) {
      this.#throwError('Client has invalid name.');
    } else if(!hasValidBalance) {
      this.#throwError('Client has invalid balance.');
    }
  }

  #validateOnAdd(id, amount) {
    this.#validateExistingId(id);

    if(amount <= 0) {
      this.#throwError('You are trying to add invalid amount.');
    }
  }

  #validateOnGet(id, cb) {
    this.#validateExistingId(id);

    if(typeof cb !== 'function') {
      this.#throwError('Third argument of get event is not a function.');
    }
  }

  #validateOnWithdraw(id, amount) {
    this.#validateExistingId(id);

    const { balance } = this.#clients.find(client => client.id === id);

    if(amount <= 0) {
      this.#throwError('You are trying to withdraw invalid amount.');
    } else if(balance - amount < 0) {
      this.#throwError(`You have exceeded your account balance. Maximum available withdraw is ${balance}.`);
    }
  }  

  #validateExistingId(id) {
    const isExisting = this.#clients.some(client => client.id === id);

    if(!isExisting) {
      this.#throwError(`There is no client in the bank with this id: "${id}"`);
    }
  }
}

const bank = new Bank();

const personId = bank.register({
  name: 'Pitter Black',
  balance: 100
});

bank.emit('add', personId, 20);
bank.emit('get', personId, (balance) => {
  console.log(`I have ${balance}₴`); // I have 120₴
});
bank.emit('withdraw', personId, 50);
bank.emit('get', personId, (balance) => {
  console.log(`I have ${balance}₴`); // I have 70₴
});