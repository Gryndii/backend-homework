const net = require('net');

const client = new net.Socket();
const userFilter = JSON.stringify({
  name: {
    first: 'John',
    last: 'd',
  },
  phone: '56',
  address: {
    zip: '1234',
    city: 'Kyiv',
    country: 'ukr',
    street: 'so'
  },
  email: '@gmail.com',
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