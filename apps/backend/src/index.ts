import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './routes/auth.routes'
const app = new Hono().basePath('/api')

app.use(cors())

app.get('/', (c) => c.text('Hello Bun!'))

app.route('/auth', auth)

export default app