import bcrypt from 'bcryptjs';

async function testHashes() {
  const password = 'admin';
  
  console.log('Testing different hash methods...');
  
  // Method 1: Standard bcrypt with salt 10
  const hash1 = await bcrypt.hash(password, 10);
  console.log('Hash1 (salt 10):', hash1);
  
  // Method 2: Standard bcrypt with salt 12
  const hash2 = await bcrypt.hash(password, 12);
  console.log('Hash2 (salt 12):', hash2);
  
  // Method 3: Test verification
  const testHash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  const isValid = await bcrypt.compare(password, testHash);
  console.log('Test hash verification:', isValid);
  
  // Method 4: Generate new hash and test
  const newHash = await bcrypt.hash(password, 12);
  const isNewValid = await bcrypt.compare(password, newHash);
  console.log('New hash:', newHash);
  console.log('New hash verification:', isNewValid);
}

testHashes().catch(console.error);
