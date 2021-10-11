const { Readable, Transform } = require('stream');

class Ui extends Readable {
  #data = [];

  constructor(data) {    
    super({
      objectMode: true,
    });    

    this.#data = JSON.parse(data);
  }

  _read() {
    const data = this.#data.shift();

    data 
      ? this.push(data)
      : this.push(null);
  } 
}

class Filter extends Transform {
  #filter = {};

  constructor(filter) {
    super({
      objectMode: true,
    });    

    this.#init(filter);
  }

  #init(filter) {
    this.#validateFilter(JSON.parse(filter));
    this.#filter = JSON.parse(filter);
  }

  #validateObjectByScheme(object, scheme, objectName = 'Object') {
    for (const key in object) {
      if (
        typeof object[key] === 'object' && 
        typeof scheme[key] === 'object'
      ) {
        this.#validateObjectByScheme(
          object[key], 
          scheme[key],
          objectName
        );

        continue;
      }

      if (!scheme.hasOwnProperty(key)) {
        this.emit(
          'error',
          `${objectName} validation error: field "${key}: ${object[key]};" is not allowed.`
        );
      } else if ((typeof object[key] !== scheme[key])) {
        this.emit(
          'error',
          `${objectName} validation error: field "${key}: ${object[key]};" contains wrong type, 
          it must be "${JSON.stringify(scheme[key])}".`
        );
      }
    }
  }

  #validateFilter(filter) {
    this.#validateObjectByScheme(
      filter,
      {
        name: {
          first: 'string',
          last: 'string'
        },
        phone: 'string',
        address: {
          zip: 'string',
          city: 'string',
          country: 'string',
          street: 'string'
        },
        email: 'string'
      },
      'Filter'
    );

    const isMainDataFilled = Boolean(
      Object.keys(filter.name).length && 
      Object.keys(filter.address).length
    );

    if (!isMainDataFilled) {
      this.emit(
        'error',
        'Filter validation error: fields "name" and "address" must not be empty.'
      );
    }
  }

  #filterObject(object) {
    console.log('chunk', chunk);
    // Object.keys(object).

    //JSON.stringify(chunk)
    return chunk;
  }

  _transform(chunk, _, done) {
    this.push(chunk);

    done();
  }
}

module.exports = {
  Ui,
  Filter,
};