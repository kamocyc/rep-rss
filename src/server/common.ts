import { Express } from 'express';
import crypto from 'crypto';
import { APP_ENC_KEY, APP_HASH_KEY } from './secure_token';

export interface LoginUser extends Express {
  id: string,
  username: string
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}

export function formatTime(d: Date): string {
  let hr = '' + d.getHours();
  let min = '' + d.getMinutes();
  let sec = '' + d.getSeconds();
  
  if(hr.length < 2) {
    hr = '0' + hr;
  }
  if(min.length < 2) {
    min = '0' + min;
  }
  if(sec.length < 2) {
    sec = '0' + sec;
  }
  
  return [hr, min, sec].join(':');
}

export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat.apply([], arr);
}

const encryptAlgorithm = 'aes-256-cbc';

function encrypt(text: string, key: Buffer): { iv: string, encrypted: string} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    encryptAlgorithm,
    key,
    iv);
  
  const encrypted = cipher.update(text);
  
  return {
    iv: iv.toString('hex'),
    encrypted: Buffer.concat([encrypted, cipher.final()]).toString('hex')
  };
}

export function decrypt(encrypted: string, ivString: string, key: Buffer): string {
  const iv = Buffer.from(ivString, 'hex');
  const decipher = crypto.createDecipheriv(encryptAlgorithm, key, iv);
  const decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
  return Buffer.concat([decrypted, decipher.final()]).toString();
}

export function encryptToken(token: string): string {
  const key = crypto.createHmac('sha256', APP_HASH_KEY).update(APP_ENC_KEY).digest();
  const { iv, encrypted } = encrypt(token, key);
  return encrypted + '|' + iv;
}

export function decryptToken(encToken: string): string {
  const key = crypto.createHmac('sha256', APP_HASH_KEY).update(APP_ENC_KEY).digest();
  const [ enc, iv ] = encToken.split('|');
  return decrypt(enc, iv, key);
}
