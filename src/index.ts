import { createServer } from 'node:http';
const port: number = 3000;
const server = createServer((request, response) => {
response.writeHead(200, { 'Content-Type': 'application/json' });
response.end(JSON.stringify({ service: 'diagnostic', ok: true }));
});
server.listen(port, () => {
console.log(`listening on http://localhost:${port}`);
});