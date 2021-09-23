const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const { pipeline, Transform, Readable } = require('stream');

const file = fs.readFileSync(path.join(__dirname, '/data/comments.json'));

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

class Json2csv extends Transform {
  #isHeaderFilled = false;
  #availableKeys = [];

  constructor(availableKeys) {
    super({
      objectMode: true,
    });    

    this.#availableKeys = availableKeys;
  }

  #convertToCsvRow(chunk, headerMode) {
    const row = [];

    for (let key in chunk) {
      const isAvailableKey = this.#availableKeys.some(
        (availableKey) => availableKey === key
      );

      if (!isAvailableKey) continue;

      row.push(
        headerMode ? key : chunk[key].toString().replace(/(\r\n|\n|\r)/gm, "")
      );
    }

    if (headerMode) this.#isHeaderFilled = true;
    
    return row.join() + EOL;
  }

  _transform(chunk, _, done) {
    if (!this.#isHeaderFilled) {
      this.push(this.#convertToCsvRow(chunk, true));
    }

    this.push(this.#convertToCsvRow(chunk, false));

    done();
  }
}

const ui = new Ui(file);
const json2csvConverter = new Json2csv(
  ['postId', 'name', 'body']
);
const fileWriteStream = fs.createWriteStream(path.join(__dirname, '/data/comments.csv'));

pipeline(
  ui,
  json2csvConverter,
  fileWriteStream,
  (error) => {
    if (error) throw error;
  }
);