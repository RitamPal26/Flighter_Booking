const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

async function applyMigrations(client) {
  const files = [
    '20260522_initial_schema.sql',
    '20260523_fix_reschedule_atomicity.sql',
    '20260523_schema_qualify_functions.sql',
  ]

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${file} (not found)`)
      continue
    }
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`  Applying ${file}...`)
    await client.query(sql)
  }
}

async function main() {
  const password = process.env.SUPABASE_PASSWORD
  const host = 'db.eifdxmjrahjodtchrloz.supabase.co'
  const conn = `postgresql://postgres:${password}@${host}:5432/postgres`

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('Connected to database')

  await client.query('BEGIN')

  try {
    // Apply all migrations first (ensure schema + RPCs are current)
    console.log('Applying migrations...')
    await applyMigrations(client)

    // Run seed.sql (handles clearing + populating data)
    console.log('Running seed.sql...')
    const seedSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'seed.sql'), 'utf8')
    await client.query(seedSql)

    await client.query('COMMIT')
    console.log('Database reset complete!')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
