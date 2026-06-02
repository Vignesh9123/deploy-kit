import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './routes/auth.routes'
import { project } from './routes/project.routes'
import { deployment } from './routes/deployment.routes'
const app = new Hono().basePath('/api')

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}))

app.get('/', (c) => c.text('Hello Bun!'))

app.route('/auth', auth)
app.route('/project', project)
app.route('/deployment', deployment)
export default {
    port: 3001,
    fetch: app.fetch
}