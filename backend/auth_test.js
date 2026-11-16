const http = require('http');
const data = JSON.stringify({
  role: 'user',
  data: {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'Test1234!',
    phone: '',
    gender: '',
    dob: ''
  }
});
const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('BODY', body));
});
req.on('error', (e) => console.error('ERROR', e));
req.write(data);
req.end();
