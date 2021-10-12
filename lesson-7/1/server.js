const net = require('net');
const fs = require('fs');
const path = require('path');
const { Ui, Filter } = require('./userManagers');
const { pipeline } = require('stream');

const server = net.createServer();
const PORT = process.env.PORT || 8081;

const users = fs.readFileSync(path.join(__dirname, '/data/users.json'));
const streamOptions = { objectMode: true };

server.on('connection', socket => {
  console.log('---> New client connected!');

  socket.on('data', filterData => {
    pipeline(
      new Ui(users, streamOptions),
      new Filter(
        JSON.parse(filterData), 
        streamOptions
      ),
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