const net = require('net');

const client = new net.Socket();
const userFilter = JSON.stringify({
  filter: {
    name: {
      first: 'Ron',
      last: 'McLaughlin'
    },
    address: {
      zip: '9'
    }
  },
  meta: {
    format: 'csv',
    archive: false
  }
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