import { warn } from "./output.js";
export const SHARED_PIPES = [];
export function cleanup(callback = () => { }) {
    process.on("beforeExit", callback);
    process.on("exit", function () {
        process.emit("beforeExit", 0);
    });
    process.on("SIGINT", function () {
        warn("Exiting Process. Shutting down Server and closing Remote Connections.");
        process.exit(2);
    });
    process.on("uncaughtException", function (e) {
        console.log("Uncaught Exception...");
        console.log(e.stack);
        process.exit(99);
    });
}
