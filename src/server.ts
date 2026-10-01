import { createServer } from 'node:http';
import { createRouter } from './router.js';
import type { Handler } from './router.js';

const router = createRouter();

const listTasks: Handler = (
  _request,
  response,
  _params,
  query
) => {
  const filters = Object.fromEntries(
    query.entries()
  );

  response.writeHead(200, {
    'Content-Type': 'application/json'
  });

  response.end(
    JSON.stringify({
      count: 2,
      filters
    })
  );
};

const showTask: Handler= (
  _request,
  response,
  params,
  _query
) => {
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });

  response.end(
    JSON.stringify({
      id: params.id,
      status: 'ok'
    })
  );
};

const createTask: Handler = (
  _request,
  response,
  _params,
  _query
) => {
  response.writeHead(201, {
    'Content-Type': 'application/json'
  });

  response.end(
    JSON.stringify({
      created: true
    })
  );
};

router.get(
  '/api/tasks',
  listTasks
);

router.get(
  '/api/tasks/{id}',
  showTask
);

router.post(
  '/api/tasks',
  createTask
);

router.get(
  '/health',
  (_request, response) => {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    });

    response.end(
      JSON.stringify({
        status: 'ok'
      })
    );
  }
);

router.notFound(
  (_request, response) => {
    response.writeHead(404, {
      'Content-Type': 'application/json'
    });

    response.end(
      JSON.stringify({
        error: 'Not found'
      })
    );
  }
);

const server = createServer(
  router.handle
);

server.listen(
  3000,
  '0.0.0.0',
  () => {
    console.log(
      'Serveur sur http://localhost:3000'
    );
  }
);

const shutdown = (signal: string) => {
  console.log(`\n${signal} — arrêt…`);

  server.close(() => {
    process.exit(0);
  });
};

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);