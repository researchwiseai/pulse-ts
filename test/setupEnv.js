import fs from 'fs'
import { config } from 'dotenv'

// Load .env.test file if it exists, but continue silently if not found
const envTestPath = '.env.test'
if (fs.existsSync(envTestPath)) {
    config({ path: envTestPath })
}
