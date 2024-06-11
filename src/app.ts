import { Hono } from 'hono';
import { fileRoutes } from './routes/files';
const app = new Hono();

app
    .basePath('/api')
    .route('/files', fileRoutes)

export default app;