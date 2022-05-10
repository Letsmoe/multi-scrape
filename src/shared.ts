import { warn } from "./output.js";

export const SHARED_PIPES = [];

export function cleanup(callback : (...args : any[]) => void = () => {}) {
	process.on("beforeExit", callback);

	// do app specific cleaning before exiting
	process.on("exit", function () {
		process.emit("beforeExit", 0);
	});

	// catch ctrl+c event and exit normally
	process.on("SIGINT", function () {
		warn("Exiting Process. Shutting down Server and closing Remote Connections.");
		process.exit(2);
	});

	//catch uncaught exceptions, trace, then exit normally
	process.on("uncaughtException", function (e) {
		console.log("Uncaught Exception...");
		console.log(e.stack);
		process.exit(99);
	});
}
