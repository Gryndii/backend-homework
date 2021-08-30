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
    this.on('data', this.#validate);
  }

  #validate({ payload, meta }) {
    this.#validatePayload(payload);
    this.#validateMeta(meta);
  }

  #validatePayload({name, email, password, ...rest}) {  
    const isFilled = name && email && password;
    const isStringFields = 
      typeof name === 'string' && 
      typeof email === 'string' && 
      typeof password === 'string';
    const noProhibitedFields = !Object.keys(rest).length;

    if(!isFilled || !isStringFields || !noProhibitedFields) {
      this.emit('error', 'Payload validation error.');
    }
  }

  #validateMeta({algorithm}) {
    const isValidAlgorithm = algorithm === 'hex' || algorithm === 'base64';

    if(!isValidAlgorithm) {
      this.emit('error', 'Meta validation error.');
    }
  }

  _read() {
    const data = this.#data.shift();

    data 
      ? this.push(data)
      : this.push(null);
  }  
}

class Decryptor extends Transform {
  constructor() {
    super({
      objectMode: true,
    });
  }

  #dencryptUser({payload, meta}) {
    return ({
      ...payload,
      email: Buffer.from(payload.email, meta.algorithm).toString(),
      password: Buffer.from(payload.password, meta.algorithm).toString(), 
    });
  }

  _transform(chunk, _, done) {
    this.push(
      this.#dencryptUser(chunk)
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
    payload: {
      name: 'Pitter Black',
      email: '70626c61636b40656d61696c2e636f6d',
      password: '70626c61636b5f313233'
    },
    meta: {
      algorithm: 'hex'
    }
  }
];

const ui = new Ui(customers);
const decryptor = new Decryptor();
const manager = new AccountManager();

ui.pipe(decryptor).pipe(manager);