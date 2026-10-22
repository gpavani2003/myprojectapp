const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const port = Number(process.env.API_PORT || 4000);
const dataPath = path.join(__dirname, "data.json");
const collections = new Set(["admin", "user", "products"]);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
]);

async function readData() {
  return JSON.parse(await fs.readFile(dataPath, "utf8"));
}

async function writeData(data) {
  const tempPath = `${dataPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, dataPath);
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body exceeds 1 MB"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const [, collection, id] = url.pathname.split("/");

    if (!collections.has(collection) || url.pathname.split("/").length > 3) {
      sendJson(response, 404, { error: "Endpoint not found" });
      return;
    }

    const data = await readData();
    if (!id && request.method === "GET") {
      sendJson(response, 200, data[collection]);
      return;
    }

    if (!id && request.method === "POST") {
      const item = await readRequestBody(request);
      if (!item || Array.isArray(item) || typeof item !== "object") {
        sendJson(response, 400, { error: "Request body must be a JSON object" });
        return;
      }
      const nextId = String(
        Math.max(0, ...data[collection].map(record => Number(record.id) || 0)) + 1,
      );
      const created = { ...item, id: item.id ?? nextId };
      data[collection].push(created);
      await writeData(data);
      sendJson(response, 201, created);
      return;
    }

    if (id && request.method === "GET") {
      const item = data[collection].find(record => String(record.id) === id);
      sendJson(response, item ? 200 : 404, item || { error: "Record not found" });
      return;
    }

    if (id && request.method === "PUT") {
      const index = data[collection].findIndex(record => String(record.id) === id);
      if (index === -1) {
        sendJson(response, 404, { error: "Record not found" });
        return;
      }
      const updates = await readRequestBody(request);
      data[collection][index] = { ...data[collection][index], ...updates, id };
      await writeData(data);
      sendJson(response, 200, data[collection][index]);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.message === "Request body must be valid JSON" ||
      error.message === "Request body exceeds 1 MB"
      ? 400
      : 500;
    console.error(error);
    sendJson(response, status, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Student portal API listening at http://localhost:${port}`);
});

server.on("error", error => {
  console.error(`Could not start the API server: ${error.message}`);
  process.exitCode = 1;
});
