import { Hono } from 'hono';
import { fileRoutes } from './routes/files';
import { logger } from 'hono/logger';
const app = new Hono();

app
    .use(logger())
    .basePath('/api')
    .route('/files', fileRoutes)

export default app;