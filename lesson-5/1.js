const { Readable, Transform, Writable, pipeline } = require('stream');
const crypto = require('crypto');

const cipherAlgorythm = 'aes-192-cbc';
const cipherPassword = '9379992CallUs';
const cipherKey = crypto.scryptSync(cipherPassword, 'salt', 24);
const cipherIv = crypto.randomBytes(16);

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
  #source = '';

  constructor() {
    super({
      objectMode: true,
    });    

    this.#init();
  }

  #init() {
    this.on('pipe', this.#setSource);
  }

  #setSource(source) {
    this.#source = source.constructor.name;
  }

  #encryptData(data) {
    const cipher = crypto.createCipheriv(
      cipherAlgorythm, 
      cipherKey, 
      cipherIv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  #encryptUser({ email, password, ...rest }) {
    return ({
      meta: {
        source: this.#source,
      },
      payload: {
        email: this.#encryptData(email),
        password: this.#encryptData(password),
        ...rest
      }
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

  #decryptData(data) {
    const decipher = crypto.createDecipheriv(
      cipherAlgorythm, 
      cipherKey, 
      cipherIv
    );

    let encrypted = decipher.update(data, 'hex', 'utf8');
    encrypted += decipher.final('utf8');

    return encrypted;
  }

  #decryptUser({ payload, ...rest }) {
    return ({
      payload: {
        ...payload,
        email: this.#decryptData(payload.email),
        password: this.#decryptData(payload.password),
      },
      ...rest
    })
  } 

  _write(chunk, _, done) {
    this.#data.push(
      this.#decryptUser(chunk)
    );

    done();
  }
}

const customers = [
  {
    name: 'Pitter Black',
    email: 'pblack@email.com',
    password: 'pblack_123'
  },
  {
    name: 'Oliver White',
    email: 'owhite@email.com',
    password: 'owhite_456',
  }
];

const ui = new Ui(customers);
const guardian = new Guardian();
const manager = new AccountManager();

pipeline(
  ui,
  guardian,
  manager,
  (error) => {
    if (error) throw error;
  }
);