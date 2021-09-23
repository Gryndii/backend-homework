const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { pipeline } = require('stream');

class Archiver {
  #options = {};
  
  constructor(optons) {
    this.#init(optons);

    this.#options = optons;
  }

  #init(options) {
    this.#validateOptions(options);
  }

  #validateOptions({ algorithm, ...rest }) {
    const isValidType = algorithm && typeof algorithm === 'string';
    const isValidValue = (algorithm === 'deflate') || (algorithm === 'gzip');
    const noProhibitedFields = !Object.keys(rest).length;

    if(!isValidType || !isValidValue || !noProhibitedFields) {
      throw new Error('Archiver options validation error!');
    }
  }

  archive() {
    return (
      this.#options.algorithm === 'deflate' 
        ? zlib.createDeflate() 
        : zlib.createGzip()
    );
  }

  unarchive() {
    return zlib.createGunzip()
  }
}

const fileReadStream = fs.createReadStream(path.join(__dirname, '/data/comments.csv'));
const archiver = new Archiver({
  algorithm: 'deflate'
});
const fileWriteStream = fs.createWriteStream(path.join(__dirname, '/data/comments.csv.gz'));

pipeline(
  fileReadStream,
  archiver.archive(),
  fileWriteStream,
  (error) => {
    if (error) throw error;
  }
);