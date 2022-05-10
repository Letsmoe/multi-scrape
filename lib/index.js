import { colarg } from "colarg";
import { fetchPage } from "./page.js";
import { validateToken } from "./db/validate.js";
import * as http from "http";
import BatchRequester from "./db/request-batch.js";
import { info, error, OutputInterface } from "./output.js";
import { WebSocketServer } from "ws";
import * as fs from "fs";
import { SocketOutputPipe } from "./socket-pipe.js";
import { SHARED_PIPES, cleanup } from "./shared.js";
import * as mime from "mime-types";
cleanup(() => {
    SHARED_PIPES.forEach(pipe => {
        pipe.send({
            action: "shutdown",
            message: "Server is shutting down."
        });
        pipe.close();
    });
});
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.stdin.resume();
const args = colarg(process.argv.slice(2))
    .option({
    name: "token",
    alias: "t",
    type: "string",
    description: "A valid API token for authenticating with the server.",
    required: true,
})
    .option({
    name: "batch-size",
    alias: "b",
    type: "number",
    description: "The number of jobs to fetch from the server at once.",
    defaults: 50,
    required: false,
})
    .option({
    name: "server",
    alias: "s",
    type: "boolean",
    description: "Whether or not to run a local server.",
    defaults: true,
    required: false,
})
    .option({
    name: "username",
    alias: "u",
    type: "string",
    description: "The username to use for authentication.",
    required: true,
})
    .option({
    name: "password",
    alias: "p",
    type: "string",
    description: "The password to use for authentication.",
    required: true,
})
    .usage("Welcome to PornSearch!\nA collaborative Web Crawler empowering the world's largest Porn Indexing Site: http://porn-search.me/")
    .help().args;
const API_TOKEN = args.token;
const USERNAME = args.username;
const PASSWORD = args.password;
if (API_TOKEN) {
    const isValidated = await validateToken(API_TOKEN, USERNAME, PASSWORD);
    info("Validating API Token...");
    if (isValidated) {
        info("Successfully validated API Token!");
        if (args.server) {
            info("Opening local server.");
            const hostname = "127.0.0.1";
            const port = 19003;
            const server = http.createServer((req, res) => {
                if (req.url === "/index") {
                    req.url = "../src/server/index.html";
                }
                let url = path.join(__dirname, req.url);
                if (fs.existsSync(url)) {
                    res.statusCode = 200;
                    let type = mime.lookup(url);
                    res.setHeader("Content-Type", type);
                    res.end(fs.readFileSync(url));
                }
                else {
                    res.statusCode = 404;
                    res.end();
                }
            });
            server.listen(port, hostname, () => {
                info(`Server is running at http://${hostname}:${port}/index`);
            });
            (() => {
                const wss = new WebSocketServer({
                    port: 19004,
                });
                info("Opened Websocket Server on port 19004.");
                wss.on("connection", (ws) => {
                    info("Opened websocket connection.");
                    ws.on("close", () => {
                        info("Closed websocket connection.");
                    });
                    const pipe = new SocketOutputPipe(ws);
                    OutputInterface.on("info", (...info) => {
                        pipe.send({
                            message: info.join(" ")
                        });
                    });
                    SHARED_PIPES.push(pipe);
                });
            })();
            const batchRequester = new BatchRequester({
                token: API_TOKEN,
                username: USERNAME,
                password: PASSWORD,
                batchSize: args.batchSize,
            });
            batchRequester.onBatchComplete = (batch) => {
                console.log(batch[1].links);
                return false;
            };
        }
    }
    else {
        error("Validating API Token failed, you may have entered an invalid token.");
    }
}
const jobList = [];
async function ExecuteJob(url) {
    return fetchPage(url);
}
