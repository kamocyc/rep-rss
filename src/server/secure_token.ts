import { loadEnv } from './env_loader';

function prepareEnv() {
  if(process.env.NODE_ENV === 'production') {
    return process.env;
  } else if(process.env.NODE_ENV === 'test') {
    return {};
  } else {
    return loadEnv();
  }
}

const env = prepareEnv();

// Switch this? (need to change site URL)
export const consumerKey = env.CONSUMER_KEY as string;
export const consumerSecret = env.CONSUMER_SECRET as string;

// Switch this!!!
//export const siteUrl = 'http://127.0.0.1:8080/';
export const siteUrl = env.SITE_URL as string;

export const APP_HASH_KEY = env.APP_HASH_KEY as string;
export const APP_ENC_KEY = env.APP_ENC_KEY as string;

export const SESSION_SECRET = env.SESSION_SECRET as string;