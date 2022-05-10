import { WebSocket } from "ws";

class SocketOutputPipe {
	private ws: WebSocket;
	/**
	 * Creates an instance of SocketOutputPipe given an instance of a connected WebSocket, this interface can be used to pipe messages to a specific WebSocket instance.
	 * @date 5/1/2022 - 12:23:01 PM
	 * @constructor
	 */
	constructor(ws: WebSocket) {
		this.ws = ws;
	}

	send(message: string | object) {
		if (typeof message === 'string') {
			this.ws.send(message);
		} else if (message instanceof Object) {
			this.ws.send(JSON.stringify(message));
		}
	}

	close() {
		this.ws.close();
	}

	onClose(callback: () => void) {
		this.ws.onclose = callback;
	}
}

export {SocketOutputPipe}