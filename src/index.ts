import { colarg, COLORS, color } from "colarg";
import { fetchPage } from "./page.js";
import { validateToken } from "./db/validate.js";
import * as http from "http";
import BatchRequester from "./db/request-batch.js";
import { RequestResult } from "./types.js";
import { write, info, warn, error, OutputInterface } from "./output.js";
import { SubmitBatch } from "./db/submit.js";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import {SocketOutputPipe} from "./socket-pipe.js";
import {SHARED_PIPES, cleanup} from "./shared.js";
import * as mime from "mime-types";

// Define a default cleanup function that will be executed right before the process closes.
cleanup(() => {
	SHARED_PIPES.forEach(pipe => {
		pipe.send({
			action: "shutdown",
			message: "Server is shutting down."
		});
		pipe.close();
	})
});

// Get the dirname
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.stdin.resume(); // Prevent program from exiting instantly.

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
	.usage(
		"Welcome to PornSearch!\nA collaborative Web Crawler empowering the world's largest Porn Indexing Site: http://porn-search.me/"
	)
	.help().args;

const API_TOKEN = args.token;
const USERNAME = args.username;
const PASSWORD = args.password;

/**
 * We want to get a response from each server, we look up which url we want to parse right now and check if it is in the list of configFiles, if so we continue.
 * A result should look like this:
 * {
 * 		server: "hqporner",
 * 		location: "/hqporn/1231231-awdaw.html"
 * 		response: {
 * 			title: "HQPorner",
 * 			length: 2412,
 * 			actors: [
 * 				{
 * 					name: "John Doe",
 * 					url: "https://hqporner.com/john-doe"
 * 				}
 * 			],
 * 			tags: [
 * 				{
 * 					name: "tag1"
 * 				},
 * 				{
 * 					name: "tag2"
 * 				}
 * 			]
 * 		}
 * }
 *
 * At first, we request a batch job from the server and parse the response.
 * This will result in us parsing an overview page where we get multiple links to videos.
 * We then send the server a response with around ~500 links each time, the server will look up which of them were already parsed and return a filtered list of new ones.
 */

if (API_TOKEN) {
	const isValidated = await validateToken(API_TOKEN, USERNAME, PASSWORD);
	info("Validating API Token...");
	if (isValidated) {
		info("Successfully validated API Token!");
		// Check if a local server shall be opened to watch progress in browser.
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
					let type = mime.lookup(url)
					res.setHeader("Content-Type", type);
					res.end(fs.readFileSync(url));
				} else {
					res.statusCode = 404;
					res.end();
				}
			});

			server.listen(port, hostname, () => {
				info(`Server is running at http://${hostname}:${port}/index`);
			});

			(() => {
				// Open a websocket server to listen on port 19004
				const wss = new WebSocketServer({
					port: 19004,
				});

				info("Opened Websocket Server on port 19004.");

				// Only open the websocket server for outgoing messages
				wss.on("connection", (ws : WebSocket) => {
					info("Opened websocket connection.");
					ws.on("close", () => {
						info("Closed websocket connection.");
					});

					const pipe = new SocketOutputPipe(ws);
					OutputInterface.on("info", (...info) => {
						pipe.send({
							message: info.join(" ")
						});
					})

					SHARED_PIPES.push(pipe);
				});
			})();

			// Create a new BatchRequester instance to pull batches from the server.
			const batchRequester = new BatchRequester({
				token: API_TOKEN,
				username: USERNAME,
				password: PASSWORD,
				batchSize: args.batchSize,
			});

			batchRequester.onBatchComplete = (batch: RequestResult[]) => {
				//SubmitBatch(batch, API_TOKEN, USERNAME, PASSWORD);
				console.log(batch[1].links);
				
				return false;
			};
		}
	} else {
		error(
			"Validating API Token failed, you may have entered an invalid token."
		);
	}
}

const jobList = [
	// "https://hqporner.com/hdporn/1",
	// "https://hqporner.com/hdporn/2",
	// "https://hqporner.com/hdporn/106264-candy_store_for_the_eyes.html"
];

async function ExecuteJob(url: string) {
	return fetchPage(url);
}
