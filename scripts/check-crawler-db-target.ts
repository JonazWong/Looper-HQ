#!/usr/bin/env tsx

function maskHost(host: string): string {
  if (host.length <= 6) return host;
  return `${host.slice(0, 3)}***${host.slice(-3)}`;
}

function parseDatabaseUrl(raw: string) {
  const parsed = new URL(raw);
  const dbName = parsed.pathname.replace(/^\//, '') || '(empty)';
  const port = parsed.port || '(default)';
  return {
    protocol: parsed.protocol,
    host: parsed.hostname,
    port,
    dbName,
  };
}

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is missing.');
  }

  const info = parseDatabaseUrl(raw);
  const inCi = process.env.GITHUB_ACTIONS === 'true';
  const local = isLocalHost(info.host);

  console.log('🔎 Crawler DB target check');
  console.log(`   protocol: ${info.protocol.replace(':', '')}`);
  console.log(`   host: ${maskHost(info.host)}`);
  console.log(`   port: ${info.port}`);
  console.log(`   database: ${info.dbName}`);

  if (inCi && local) {
    throw new Error('Invalid DATABASE_URL for GitHub Actions: points to localhost. Use DO managed DB secret instead.');
  }

  if (info.host.includes('ondigitalocean.com') || info.host.includes('db.ondigitalocean.com')) {
    console.log('✅ Target appears to be DigitalOcean managed database.');
  }
}

main();