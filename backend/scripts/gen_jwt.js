const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || '1bd63ecc-baf4-4e93-a6f8-c1629fd5d54a';
const token = jwt.sign({ id: 'test-admin', role: 'admin', email: 'admin@example.com' }, secret, { expiresIn: '7d' });
console.log(token);
