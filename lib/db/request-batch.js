import fetch from "node-fetch";
import { Request } from "./class.request.js";
import { error, info } from "../output.js";
export default class BatchRequester {
    constructor({ batchSize, token, username, password }) {
        this.batchSize = 500;
        this.responses = [];
        this.expectedResultCount = 0;
        this.onComplete = () => { };
        this.onError = (...args) => {
            error(...args);
        };
        this.onBatchComplete = () => false;
        this.token = token;
        this.username = username;
        this.password = password;
        this.batchSize = batchSize || 100;
        this.fetchNewBatch();
    }
    async fetchNewBatch() {
        this.expectedResultCount = 0;
        const jobList = await fetch(`http://porn-search.me/api/worker/request-batch.php?token=${this.token}&username=${this.username}&password=${this.password}&batchSize=${this.batchSize}`);
        const content = await jobList.json();
        if (content.status === "success") {
            info("Successfully pulled batch of " + content.value.length + " jobs.");
            const jobList = content.value;
            for (const job of jobList) {
                this.expectedResultCount++;
                let request = new Request(job);
                request.onComplete = (result) => {
                    this.evaluateResult(result);
                };
                request.onError = (error) => {
                    this.evaluateResult(error);
                    this.expectedResultCount--;
                };
            }
        }
        else {
            this.onError(new Error(content.value));
        }
    }
    async evaluateResult(result) {
        if (result.status === "error") {
            this.onError(new Error(result.value));
        }
        else {
            this.responses.push(result.value);
        }
        if (this.responses.length === this.expectedResultCount) {
            let shouldContinue = this.onBatchComplete(this.responses);
            this.responses = [];
            if (shouldContinue) {
                this.fetchNewBatch();
            }
            else {
                this.onComplete();
            }
        }
    }
}
