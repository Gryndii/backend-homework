const { Readable, Transform, Writable, pipeline } = require('stream');
const crypto = require('crypto');
const fs = require('fs');

const cipherAlgorythm = 'aes-192-cbc';
const cipherPassword = '9379992CallUs';
const cipherKey = crypto.scryptSync(cipherPassword, 'salt', 24);
const cipherIv = crypto.randomBytes(16);
const serverKey = fs.readFileSync('./server-key.pem', {encoding: 'utf8'});
const serverCert = fs.readFileSync('./server-cert.pem', {encoding: 'utf8'});

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

  #signData(data) {
    const sign = crypto.createSign('SHA256');

    sign.update(JSON.stringify(data));
    sign.end();

    return sign.sign(serverKey, 'hex');
  }

  #encryptUser({ email, password, ...rest }) {
    return ({
      meta: {
        source: this.#source,
        signature: this.#signData({ email, password, ...rest }),
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

  #verifyData({ meta, payload }) {
    const verify = crypto.createVerify('SHA256');

    verify.update(JSON.stringify(payload));
    verify.end();

    const isValid = verify.verify(serverCert, meta.signature, 'hex');

    if (!isValid) {
      this.emit('error', 'Data sign validation error!');
    }
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
    const decryptedData = this.#decryptUser(chunk);

    this.#verifyData(decryptedData);

    this.#data.push(decryptedData);
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