import { COLORS, color } from "colarg";
const listeners = [];
export class OutputInterface {
    static on(name, callback) {
        listeners.push([name, callback]);
    }
    static call(name, ...args) {
        for (const listener of listeners) {
            if (listener[0] === name) {
                listener[1](...args);
            }
        }
    }
}
export const write = (...args) => {
    process.stdout.write(args.join(" ") + "\n");
};
export const info = (...args) => {
    let out = [color("[INFO]", COLORS.GREEN), "\t", ...args];
    write(...out);
    OutputInterface.call("info", ...out);
};
export const warn = (...args) => {
    let out = [color("[WARN]", COLORS.YELLOW), "\t", ...args];
    write(...out);
    OutputInterface.call("warn", ...out);
};
export const error = (...args) => {
    let out = [color("[ERROR]", COLORS.RED), "\t", ...args];
    write(...out);
    OutputInterface.call("error", ...out);
    process.exit(1);
};
