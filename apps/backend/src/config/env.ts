import {config} from 'dotenv'
config()

export const env = {
    DATABASE_URL: String(process.env.DATABASE_URL),
    JWT_SECRET: String(process.env.JWT_SECRET),
}