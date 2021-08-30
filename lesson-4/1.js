const { Readable, Transform, Writable } = require('stream');

class Ui extends Readable {
  #data = [];

  constructor(data) {
    super({
      objectMode: true,
    });

    this.#data = data;
    this.#init();
  }

  #init() {
    this.on('data', this.#validateUser);
  }

  #validateUser({name, email, password, ...rest}) {  
    const isFilled = name && email && password;
    const isStringFields = 
      typeof name === 'string' && 
      typeof email === 'string' && 
      typeof password === 'string';
    const noProhibitedFields = !Object.keys(rest).length;

    if(!isFilled || !isStringFields || !noProhibitedFields) {
      this.emit('error', 'Validation error.');
    }
  }

  _read() {
    const data = this.#data.shift();

    data 
      ? this.push(data)
      : this.push(null);
  }  
}

class Guardian extends Transform {
  constructor() {
    super({
      objectMode: true,
    });
  }

  #encryptUser({ email, password, ...rest }) {
    return ({
      email: Buffer.from(email, 'utf-8').toString('hex'),
      password: Buffer.from(password, 'utf-8').toString('hex'),
      ...rest
    })
  }

  _transform(chunk, _, done) {
    this.push(
      this.#encryptUser(chunk)
    );
    done();
  }
}

class AccountManager extends Writable {
  #data = [];

  constructor() {
    super({
      objectMode: true,
    });
  }

  _write(chunk, _, done) {
    this.#data.push(chunk);
    done();
  }
}

const customers = [
  {
    name: 'Pitter Black',
    email: 'pblack@email.com',
    password: 'pblack_123',
  },
  {
    name: 'Oliver White',
    email: 'owhite@email.com',
    password: 'owhite_456'
  }
];

const ui = new Ui(customers);
const guardian = new Guardian();
const manager = new AccountManager();

ui.pipe(guardian).pipe(manager);