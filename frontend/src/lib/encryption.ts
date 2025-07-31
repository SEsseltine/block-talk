import { type Address } from 'viem';
import { initializeWallet, ensureWalletConnected } from './wallet';

const SIGNING_MESSAGE = "BlockTalk Encryption Key Generation";

export interface EncryptionKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyBytes: Uint8Array;
}

export async function deriveEncryptionKeys(address: Address): Promise<EncryptionKeyPair> {
  try {
    console.log('Requesting signature for encryption key generation...');
    console.log('Address:', address);
    console.log('Message:', SIGNING_MESSAGE);

    // Ensure wallet is connected and on right network
    const connectedAddress = await ensureWalletConnected();

    if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Connected account does not match requested address');
    }

    const { ethereum } = initializeWallet();
    if (!ethereum) {
      throw new Error('Wallet provider not available');
    }

    console.log('Using direct ethereum provider for signing...');

    // Try simple string first, then hex if that fails
    let signature;
    try {
      signature = await ethereum.request({
        method: 'personal_sign',
        params: [SIGNING_MESSAGE, address.toLowerCase()],
      }) as string;
    } catch {
      console.log('String message failed, trying hex encoding...');
      const messageHex = `0x${Buffer.from(SIGNING_MESSAGE, 'utf8').toString('hex')}`;
      signature = await ethereum.request({
        method: 'personal_sign',
        params: [messageHex, address.toLowerCase()],
      }) as string;
    }

    console.log('Signature received:', signature);

    // Use signature as seed for deterministic key generation
    const signatureBytes = new Uint8Array(
      signature.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    // Create deterministic seed from signature
    const seed = await crypto.subtle.digest('SHA-256', signatureBytes);

    // For simplicity, let's derive a 32-byte key directly from the signature
    // This gives us a deterministic private key for each user
    console.log('Deriving encryption key from signature...');

    // Use the signature hash as our private key (32 bytes)
    const privateKeyBytes = new Uint8Array(seed);

    // Generate corresponding public key (we'll simulate this for now)
    // In practice, you'd derive the public key from the private key
    const publicKeyBytes = new Uint8Array(32);
    publicKeyBytes.set(privateKeyBytes.slice(0, 16)); // First 16 bytes
    publicKeyBytes.set(privateKeyBytes.slice(16, 32), 16); // Last 16 bytes

    // Create a simple key pair for AES encryption
    const aesKey = await crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: aesKey,
      privateKey: aesKey,
      publicKeyBytes,
    };
  } catch (error) {
    throw new Error(`Failed to derive encryption keys: ${error}`);
  }
}

export async function encryptMessage(
  message: string,
  recipientPublicKeyBytes: Uint8Array
): Promise<string> {
  try {
    console.log('Starting message encryption...');
    console.log('Message length:', message.length);
    console.log('Recipient public key bytes length:', recipientPublicKeyBytes.length);

    // Create AES key from recipient's public key bytes
    console.log('Creating AES key from recipient public key...');
    const recipientAESKey = await crypto.subtle.importKey(
      'raw',
      recipientPublicKeyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    console.log('Recipient AES key created successfully');

    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    console.log('Message encoded, byte length:', messageBytes.length);

    // Generate random IV for encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt message using AES-GCM
    console.log('Encrypting message with AES-GCM...');
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      recipientAESKey,
      messageBytes
    );
    console.log('Message encrypted successfully');

    // Combine IV and encrypted data
    const result = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
    };

    console.log('Encryption complete');
    return JSON.stringify(result);
  } catch (error) {
    console.error('Encryption error details:', error);
    throw new Error(`Failed to encrypt message: ${error}`);
  }
}

export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey,
  isRecipient: boolean = true
): Promise<string> {
  try {
    console.log('Decrypting message:', encryptedMessage);
    const parsed = JSON.parse(encryptedMessage);

    // Check if it's the new AES format
    if (parsed.iv && parsed.data) {
      console.log('Using AES-GCM decryption');
      const iv = new Uint8Array(parsed.iv);
      const encryptedData = new Uint8Array(parsed.data);

      const decryptedBytes = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        privateKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBytes);
    } else {
      // Legacy RSA format (for backwards compatibility)
      console.log('Using legacy RSA decryption');
      const encryptedData = isRecipient ? parsed.recipient : parsed.sender;
      const encryptedBuffer = new Uint8Array(encryptedData);

      const decryptedBytes = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBytes);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt message: ${error}`);
  }
}

export function publicKeyToHex(publicKeyBytes: Uint8Array): string {
  return Array.from(publicKeyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToPublicKey(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Unused function - kept for potential future use
// async function getPublicKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
//   // This is a workaround since Web Crypto API doesn't have direct method
//   // We'll export the private key and re-import as public
//   const jwk = await crypto.subtle.exportKey('jwk', privateKey);
//
//   // Remove private components
//   delete jwk.d;
//   delete jwk.dp;
//   delete jwk.dq;
//   delete jwk.q;
//   delete jwk.qi;
//
//   return await crypto.subtle.importKey(
//     'jwk',
//     jwk,
//     {
//       name: 'RSA-OAEP',
//       hash: 'SHA-256',
//     },
//     true,
//     ['encrypt']
//   );
// }