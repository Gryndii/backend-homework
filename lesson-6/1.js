const fs = require('fs');
const path = require('path');
const { pipeline, Transform } = require('stream');

const fileStream = fs.createReadStream(path.join(__dirname, '/data/comments.json'));
const fileWriteStream = fs.createWriteStream(path.join(__dirname, '/data/comments.csv'));

class Json2csv extends Transform {
  constructor() {
    super({
      objectMode: true,
    });    
  }

  #getHeaders(row) {
    const headers = [];

    for (let key in row) {
      headers.push(key);
    }

    return headers.join();
  }

  _transform(chunk, _, done) {
    console.log('chunk----------->', JSON.parse(chunk));
    this.push(chunk);
    done();
  }
}

const json2csvConverter = new Json2csv();

pipeline(
  fileStream,
  json2csvConverter,
  fileWriteStream,
  (error) => {
    if (error) throw error;
  }
);