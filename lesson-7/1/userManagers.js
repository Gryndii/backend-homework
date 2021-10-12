const { Readable, Transform } = require('stream');

class Ui extends Readable {
  #data = [];

  constructor(data, options) {    
    super(options);    

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

  constructor(filter, options) {
    super(options);    

    this.#init(filter);
  }

  #init(filter) {
    this.#validateFilter(filter);
    this.#filter = filter;
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

  #filterObject(object, filter) {  
    for (const key in filter) {
      if (
        typeof object[key] === 'object' && 
        typeof filter[key] === 'object'
      ) {
        const isSubObjectValid = this.#filterObject(
          object[key], 
          filter[key]
        );
        
        if (isSubObjectValid) {
          continue;
        } else {
          return false;
        }
      }

      if (!object[key].toLowerCase().includes(
        filter[key].toLowerCase()
      )) {
        return false;
      }
    }  
    
    return true;
  }

  _transform(chunk, _, done) {
    const isFiltered = this.#filterObject(chunk, this.#filter);

    if (isFiltered) {
      this.push(JSON.stringify(chunk));
    }

    done();
  }
}

module.exports = {
  Ui,
  Filter,
};