const net = require('net');

const client = new net.Socket();
const userFilter = JSON.stringify({
  name: {
    first: 'Barton',
  },
  address: {
    zip: '5',
  },
});

client.connect(8081, () => {
  console.log('---> Connected to server');
  
  client.write(userFilter);
});

client.on('data', data => {
  console.log('---> Server responsed with ', data.toString());
});

client.on('close', () => {
  console.log('---> Connection closed');
});