import type { IncomingMessage, ServerResponse } from 'node:http';

export type Handler = (
  request: IncomingMessage,
  response: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => void | Promise<void>;

type Route = {
  method: string;
  path: string;
  handler: Handler;
};

const matchRoute = (
  routePath: string,
  pathname: string
): Record<string, string> | null => {
  const routeSegments = routePath.split('/');
  const pathSegments = pathname.split('/');

  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const pathSegment = pathSegments[i];

    if (routeSegment === '') {
      if (pathSegment !== '') {
        return null;
      }

      continue;
    }

    if (
      routeSegment.startsWith('{') &&
      routeSegment.endsWith('}')
    ) {
      const name = routeSegment.slice(1, -1);

      if (pathSegment === '') {
        return null;
      }

      params[name] = pathSegment;
      continue;
    }

    if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return params;
};

const isDynamicRoute = (path: string): boolean => {
  return path
    .split('/')
    .some(
      (segment) =>
        segment.startsWith('{') &&
        segment.endsWith('}')
    );
};

export const createRouter = () => {
  const routes: Route[] = [];

  let notFoundHandler: Handler = (_request, response) => {
    response.writeHead(404, {
      'Content-Type': 'application/json'
    });

    response.end(
      JSON.stringify({
        error: 'Not found'
      })
    );
  };

  const get = (path: string, handler: Handler) => {
    routes.push({
      method: 'GET',
      path,
      handler
    });
  };

  const post = (path: string, handler: Handler) => {
    routes.push({
      method: 'POST',
      path,
      handler
    });
  };

  const notFound = (handler: Handler) => {
    notFoundHandler = handler;
  };

  const handle = async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    const url = new URL(
      request.url ?? '/',
      `http://${request.headers.host ?? 'localhost'}`
    );

    const pathname = url.pathname;
    const query = url.searchParams;

    const orderedRoutes = [...routes].sort((a, b) => {
      const aDynamic = isDynamicRoute(a.path);
      const bDynamic = isDynamicRoute(b.path);

      if (aDynamic === bDynamic) {
        return 0;
      }

      return aDynamic ? 1 : -1;
    });

    let pathExists = false;
    const allowedMethods = new Set<string>();

    for (const route of orderedRoutes) {
      const params = matchRoute(
        route.path,
        pathname
      );

      if (params === null) {
        continue;
      }

      pathExists = true;
      allowedMethods.add(route.method);

      if (route.method === request.method) {
        await route.handler(
          request,
          response,
          params,
          query
        );

        return;
      }
    }

    if (pathExists) {
      response.writeHead(405, {
        'Content-Type': 'application/json',
        Allow: [...allowedMethods].join(', ')
      });

      response.end(
        JSON.stringify({
          error: 'Method Not Allowed'
        })
      );

      return;
    }

    notFoundHandler(request, response, {}, query);
  };

  return {
    get,
    post,
    notFound,
    handle
  };
};