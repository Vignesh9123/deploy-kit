import {config} from 'dotenv'
config()

export const env = {
    FIREBASE_PROJECT_ID: String(process.env.FIREBASE_PROJECT_ID),
    DATABASE_URL: String(process.env.DATABASE_URL),
    JWT_SECRET: String(process.env.JWT_SECRET),
}