const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function main() {
  const password = process.env.SUPABASE_PASSWORD
  const host = 'db.eifdxmjrahjodtchrloz.supabase.co'
  const conn = `postgresql://postgres:${password}@${host}:5432/postgres`

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('Connected to database')

  await client.query('BEGIN')

  try {
    // Disable the trigger temporarily so we can delete without firing
    await client.query('ALTER TABLE bookings DISABLE TRIGGER check_cancellation_window')

    // Delete in reverse FK order
    console.log('Clearing existing data...')
    await client.query('DELETE FROM reschedules')
    await client.query('DELETE FROM passengers')
    await client.query('DELETE FROM bookings')
    await client.query('DELETE FROM seats')
    await client.query('DELETE FROM flights')

    // Re-enable trigger
    await client.query('ALTER TABLE bookings ENABLE TRIGGER check_cancellation_window')

    // Read and execute seed.sql
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
