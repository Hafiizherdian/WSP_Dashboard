const bcrypt = require('bcryptjs');

const password = 'RootAdmin123!';
const saltRounds = 12;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('SQL:');
    console.log(`INSERT INTO users (username, email, password_hash, role, is_active, allowed_areas) VALUES ('root', 'root@example.com', '${hash}', 'root', true, '{}');`);
  })
  .catch(err => console.error('Error:', err));
