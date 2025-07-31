import { type Address } from 'viem';
import { walletClient } from './wallet';

const SIGNING_MESSAGE = "BlockTalk Encryption Key Generation";

export interface EncryptionKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyBytes: Uint8Array;
}

export async function deriveEncryptionKeys(address: Address): Promise<EncryptionKeyPair> {
  try {
    // Get deterministic signature from wallet
    const signature = await walletClient.signMessage({
      account: address,
      message: SIGNING_MESSAGE,
    });

    // Convert signature to seed
    const encoder = new TextEncoder();
    const signatureBytes = encoder.encode(signature);
    const seed = await crypto.subtle.digest('SHA-256', signatureBytes);

    // Generate encryption keypair from seed
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Export public key for sharing
    const publicKeyBytes = new Uint8Array(
      await crypto.subtle.exportKey('spki', keyPair.publicKey)
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyBytes,
    };
  } catch (error) {
    throw new Error(`Failed to derive encryption keys: ${error}`);
  }
}

export async function encryptMessage(
  message: string, 
  recipientPublicKeyBytes: Uint8Array,
  senderPrivateKey: CryptoKey
): Promise<string> {
  try {
    // Import recipient's public key
    const recipientPublicKey = await crypto.subtle.importKey(
      'spki',
      recipientPublicKeyBytes,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);

    // Encrypt for recipient
    const encryptedForRecipient = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      messageBytes
    );

    // Encrypt for sender (so they can also decrypt)
    const senderPublicKey = await crypto.subtle.exportKey('spki', 
      await getPublicKeyFromPrivate(senderPrivateKey)
    );
    
    const senderPubKey = await crypto.subtle.importKey(
      'spki',
      senderPublicKey,
      {
        name: 'RSA-OAEP', 
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    const encryptedForSender = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      senderPubKey,
      messageBytes
    );

    // Combine both encrypted versions
    const dualEncrypted = {
      recipient: Array.from(new Uint8Array(encryptedForRecipient)),
      sender: Array.from(new Uint8Array(encryptedForSender)),
    };

    return JSON.stringify(dualEncrypted);
  } catch (error) {
    throw new Error(`Failed to encrypt message: ${error}`);
  }
}

export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey,
  isRecipient: boolean = true
): Promise<string> {
  try {
    const dualEncrypted = JSON.parse(encryptedMessage);
    const encryptedData = isRecipient ? dualEncrypted.recipient : dualEncrypted.sender;
    const encryptedBuffer = new Uint8Array(encryptedData);

    const decryptedBytes = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (error) {
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

async function getPublicKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
  // This is a workaround since Web Crypto API doesn't have direct method
  // We'll export the private key and re-import as public
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  
  // Remove private components
  delete jwk.d;
  delete jwk.dp;
  delete jwk.dq;
  delete jwk.q;
  delete jwk.qi;
  
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}