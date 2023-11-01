import { config } from 'dotenv'
import type { Config } from 'drizzle-kit'

config({ path: '.env' })

export default {
    schema: './src/db/schema.ts',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL as string,
    },
} satisfies Config