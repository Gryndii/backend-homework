const { Readable, Transform, Writable } = require('stream');
const { EventEmitter } = require('events');

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
    });
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

class Logger extends Transform {
  #database;
  #source = '';

  constructor(database) {
    super({
      objectMode: true,
    });

    this.#database = database;
    
    this.#init();
  }

  #init() {
    this.on('pipe', this.#setSource);
  }

  #setSource(source) {
    this.#source = source.constructor.name;
  }

  _transform(chunk, _, done) {
    this.push(chunk);

    this.#database.emit('addData', {
      source: this.#source,
      payload: chunk,
      created: new Date().toISOString(),
    });

    done();
  }
}

class DB extends EventEmitter {
  #data = [];

  constructor() {
    super();
    this.#init();
  }

  #init() {
    this.on('addData', this.#addData);
  }

  #addData(data) {
    this.#data.push(data);
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

const database = new DB();
const ui = new Ui(customers);
const guardian = new Guardian();
const logger = new Logger(database);
const manager = new AccountManager();

ui.pipe(guardian).pipe(logger).pipe(manager);