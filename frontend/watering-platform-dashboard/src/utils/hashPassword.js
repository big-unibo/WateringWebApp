import { SHA512 } from 'crypto-js';

const hashPassword = (password) => {
  const hash = SHA512(password).toString()
  return hash;
}

export default hashPassword