import { createServer } from "node:http";
//#region src/router.ts
const matchRoute = (routePath, pathname) => {
	const routeSegments = routePath.split("/");
	const pathSegments = pathname.split("/");
	if (routeSegments.length !== pathSegments.length) return null;
	const params = {};
	for (let i = 0; i < routeSegments.length; i++) {
		const routeSegment = routeSegments[i];
		const pathSegment = pathSegments[i];
		if (routeSegment === "") {
			if (pathSegment !== "") return null;
			continue;
		}
		if (routeSegment.startsWith("{") && routeSegment.endsWith("}")) {
			const name = routeSegment.slice(1, -1);
			if (pathSegment === "") return null;
			params[name] = pathSegment;
			continue;
		}
		if (routeSegment !== pathSegment) return null;
	}
	return params;
};
const isDynamicRoute = (path) => {
	return path.split("/").some((segment) => segment.startsWith("{") && segment.endsWith("}"));
};
const createRouter = () => {
	const routes = [];
	let notFoundHandler = (_request, response) => {
		response.writeHead(404, { "Content-Type": "application/json" });
		response.end(JSON.stringify({ error: "Not found" }));
	};
	const get = (path, handler) => {
		routes.push({
			method: "GET",
			path,
			handler
		});
	};
	const post = (path, handler) => {
		routes.push({
			method: "POST",
			path,
			handler
		});
	};
	const notFound = (handler) => {
		notFoundHandler = handler;
	};
	const handle = async (request, response) => {
		const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
		const pathname = url.pathname;
		const query = url.searchParams;
		const orderedRoutes = [...routes].sort((a, b) => {
			const aDynamic = isDynamicRoute(a.path);
			if (aDynamic === isDynamicRoute(b.path)) return 0;
			return aDynamic ? 1 : -1;
		});
		let pathExists = false;
		const allowedMethods = /* @__PURE__ */ new Set();
		for (const route of orderedRoutes) {
			const params = matchRoute(route.path, pathname);
			if (params === null) continue;
			pathExists = true;
			allowedMethods.add(route.method);
			if (route.method === request.method) {
				await route.handler(request, response, params, query);
				return;
			}
		}
		if (pathExists) {
			response.writeHead(405, {
				"Content-Type": "application/json",
				Allow: [...allowedMethods].join(", ")
			});
			response.end(JSON.stringify({ error: "Method Not Allowed" }));
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
//#endregion
//#region src/server.ts
const router = createRouter();
const listTasks = (_request, response, _params, query) => {
	const filters = Object.fromEntries(query.entries());
	response.writeHead(200, { "Content-Type": "application/json" });
	response.end(JSON.stringify({
		count: 2,
		filters
	}));
};
const showTask = (_request, response, params, _query) => {
	response.writeHead(200, { "Content-Type": "application/json" });
	response.end(JSON.stringify({
		id: params.id,
		status: "ok"
	}));
};
const createTask = (_request, response, _params, _query) => {
	response.writeHead(201, { "Content-Type": "application/json" });
	response.end(JSON.stringify({ created: true }));
};
router.get("/api/tasks", listTasks);
router.get("/api/tasks/{id}", showTask);
router.post("/api/tasks", createTask);
router.get("/health", (_request, response) => {
	response.writeHead(200, { "Content-Type": "application/json" });
	response.end(JSON.stringify({ status: "ok" }));
});
router.notFound((_request, response) => {
	response.writeHead(404, { "Content-Type": "application/json" });
	response.end(JSON.stringify({ error: "Not found" }));
});
const server = createServer(router.handle);
server.listen(3e3, "0.0.0.0", () => {
	console.log("Serveur sur http://localhost:3000");
});
const shutdown = (signal) => {
	console.log(`\n${signal} — arrêt…`);
	server.close(() => {
		process.exit(0);
	});
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
//#endregion

//# sourceMappingURL=server.js.map