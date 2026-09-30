const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '..');
const env = { ...parseEnv(fs.readFileSync(path.join(root, 'backend/.env'), 'utf8')), ...process.env };
const schema = fs.readFileSync(path.join(root, 'supabase/esquema.sql'), 'utf8');
const tables = [...schema.matchAll(/create table (\w+)\s*\(/gi)].map(match => match[1]);
async function main() {
  const backup = { createdAt: new Date().toISOString(), tables: {} };
  for (const table of tables) {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc&offset=${offset}&limit=1000`, {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      });
      if (!response.ok) throw new Error(`No se pudo respaldar ${table}: HTTP ${response.status}`);
      const page = await response.json();
      rows.push(...page);
      if (page.length < 1000) break;
    }
    backup.tables[table] = rows;
    console.log(`${table}: ${rows.length} filas`);
  }
  const target = path.join(root, 'supabase/respaldo.local.json');
  fs.writeFileSync(target, JSON.stringify(backup, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(target, 0o600);
  console.log('Respaldo local guardado; excluido de Git.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
