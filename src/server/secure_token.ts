// Switch this? (need to change site URL)
export const consumerKey = process.env.CONSUMER_KEY as string;
export const consumerSecret = process.env.CONSUMER_SECRET as string;

// Switch this!!!
//export const siteUrl = 'http://127.0.0.1:8080/';
export const siteUrl = process.env.SITE_URL as string;

export const APP_HASH_KEY = process.env.APP_HASH_KEY as string;
export const APP_ENC_KEY = process.env.APP_ENC_KEY as string;