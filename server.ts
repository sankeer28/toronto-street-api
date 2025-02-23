import express from 'express';
import handler from './api/index';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const app = express();
const port = 3000;

// Adapter function to convert Express request to Vercel request format
function adaptRequest(req: express.Request): VercelRequest {
  return {
    query: req.query,
    cookies: req.cookies || {},
    body: req.body,
    headers: req.headers as { [key: string]: string },
    method: req.method,
    url: req.url
  } as VercelRequest;
}

app.get('/', (req, res) => {
  const adaptedReq = adaptRequest(req);
  handler(adaptedReq, res as unknown as VercelResponse);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Try: http://localhost:3000/?lat=43.6532&lng=-79.3832');
});
