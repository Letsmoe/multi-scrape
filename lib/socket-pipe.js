class SocketOutputPipe {
    constructor(ws) {
        this.ws = ws;
    }
    send(message) {
        if (typeof message === 'string') {
            this.ws.send(message);
        }
        else if (message instanceof Object) {
            this.ws.send(JSON.stringify(message));
        }
    }
    close() {
        this.ws.close();
    }
    onClose(callback) {
        this.ws.onclose = callback;
    }
}
export { SocketOutputPipe };
