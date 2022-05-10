import { Response, BatchJob, RequestResult } from "../types.js";
import fetch from "node-fetch";
import { Request } from "./class.request.js";
import { error, info } from "../output.js";

export default class BatchRequester {
	private batchSize: number = 500;
	private responses: RequestResult[] = [];
	private expectedResultCount: number = 0;
	private readonly username: string;
	private readonly password: string;
	private readonly token: string;

	public onProgress: (progress: number) => void;
	public onComplete: () => void = () => {};
	public onError: (error: Error) => void = (...args) => {
		error(...args);
	};
	public onBatchComplete: (batch: RequestResult[]) => boolean = () => false;

	constructor({ batchSize, token, username, password }) {
		// We will need token, username and password to authenticate with the server each time we want to request a new batch or submit a result.
		this.token = token;
		this.username = username;
		this.password = password;
		this.batchSize = batchSize || 100;

		this.fetchNewBatch();
	}

	
	/**
	 * A method to pull new jobs from the main server @ (porn-search.me/api/generate_batch_jobs.php)
	 * @date 4/30/2022 - 2:07:03 PM
	 * @private
	 */
	private async fetchNewBatch() {
		// Reset the count of expected results
		this.expectedResultCount = 0;

		const jobList = await fetch(`http://porn-search.me/api/worker/request-batch.php?token=${this.token}&username=${this.username}&password=${this.password}&batchSize=${this.batchSize}`);
		// Loop through all jobs, executing them in order and sending a response to the server.
		const content = (await jobList.json() as Response);
		if (content.status === "success") {
			info("Successfully pulled batch of " + content.value.length + " jobs.");
			const jobList = content.value;
			for (const job of jobList) {
				this.expectedResultCount++;
				let request = new Request((job as BatchJob));
				// Lazily push the result into the local batch array once it's done.
				request.onComplete = (result : Response) => {
					this.evaluateResult(result);
				}
				request.onError = (error : Response) => {
					this.evaluateResult(error);
					this.expectedResultCount--;
				}
			}
		} else {
			this.onError(new Error(content.value));
		}
	}

	private async evaluateResult(result : Response) {
		// If the request failed, we issue a callback
		if (result.status === "error") {
			this.onError(new Error(result.value));
		} else {
			// The request succeeded, we push the result into the local batch array.
			this.responses.push(result.value);
		}

		// Check if we have all responses from the current batch.
		if (this.responses.length === this.expectedResultCount) {
			// We have all responses, we can issue a callback.
			let shouldContinue = this.onBatchComplete(this.responses)
			// Reset the local batch array.
			this.responses = [];
			if (shouldContinue) {
				this.fetchNewBatch();
			} else {
				this.onComplete();
			}
		}
	}
}