const net = require('net');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { Ui, Filter, Json2csv } = require('./userManagers');
const zlib = require('zlib');

const server = net.createServer();
const PORT = process.env.PORT || 8081;

const users = fs.readFileSync(path.join(__dirname, '/data/users.json'));
const streamOptions = { objectMode: true };

server.on('connection', socket => {
  console.log('---> New client connected!');

  socket.on('data', data => {
    const { filter, meta } = JSON.parse(data);

    const middleware = [
      new Ui(users, streamOptions),
      new Filter(filter, streamOptions),
    ];

    if (meta.format === 'csv') {
      middleware.push(
        new Json2csv(streamOptions)
      );
    }
    if (meta.archive) {
      middleware.push(
        zlib.createGzip()
      );
    }

    pipeline(
      ...middleware,
      socket,
      (error) => {
        if (error) throw error;
      }
    )
  });
});

server.on('listening', () => {
  const { port } = server.address();
  console.log('---> Server started on port : ', port);
});

server.listen(PORT);