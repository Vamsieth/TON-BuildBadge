import { Address } from 'ton';

function testAddressParsing() {
  const validAddress = 'EQBYiv7_vS560zBsh6Gv-77983rXvp-3vVpX77-vS560zBlA';
  const invalidAddress = 'invalid-address';

  try {
    Address.parse(validAddress);
    console.log('✅ Valid address parsed successfully');
  } catch (e) {
    console.error('❌ Valid address failed to parse');
  }

  try {
    Address.parse(invalidAddress);
    console.error('❌ Invalid address parsed (should have failed)');
  } catch (e) {
    console.log('✅ Invalid address failed to parse as expected');
  }
}

testAddressParsing();

