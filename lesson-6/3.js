const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { pipeline } = require('stream');

class Archiver {
  archive() {
    return zlib.createGzip()
  }

  unarchive() {
    return zlib.createGunzip()
  }
}

const fileReadStream = fs.createReadStream(path.join(__dirname, '/data/comments.csv'));
const archiver = new Archiver();
const fileWriteStream = fs.createWriteStream(path.join(__dirname, '/data/comments.csv.gz'));

pipeline(
  fileReadStream,
  archiver.archive(),
  fileWriteStream,
  (error) => {
    if (error) throw error;
  }
);