import fs from 'fs';

export function loadEnv(envPath?: string) {
  envPath = envPath || '.env';
  const envText = fs.readFileSync(envPath);
  
  const lines = envText
    .toString()
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line !== '' && line[0] !== '#')
    .map(line => {
      const [key, value] = line.split(/=/);
      return [
        key,
        value.replace(/^"|"$/g, '')
      ];
    });
  
  return Object.fromEntries(lines) as { [key: string]: string };
}
