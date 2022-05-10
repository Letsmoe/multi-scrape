import { COLORS, color } from "colarg";

const listeners: [string, Function][] = [];

export class OutputInterface {
	static on(name: string, callback: (...args: any[]) => void) {
		listeners.push([name, callback]);
	}

	static call(name: string, ...args: any[]) {
		for (const listener of listeners) {
			if (listener[0] === name) {
				listener[1](...args);
			}
		}
	}
}

export const write = (...args: any[]) => {
	process.stdout.write(args.join(" ") + "\n");
};
export const info = (...args: any[]) => {
	let out = [color("[INFO]", COLORS.GREEN), "\t", ...args];
	write(...out);
	OutputInterface.call("info", ...out);
};
export const warn = (...args: any[]) => {
	let out = [color("[WARN]", COLORS.YELLOW), "\t", ...args];
	write(...out);
	OutputInterface.call("warn", ...out);
};
export const error = (...args: any[]) => {
	let out = [color("[ERROR]", COLORS.RED), "\t", ...args];
	write(...out);
	OutputInterface.call("error", ...out);
	process.exit(1);
};
