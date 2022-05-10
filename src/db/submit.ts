import {write, info, warn, error} from "../output.js";
import fetch from 'node-fetch';
import {Response} from "../types.js";

export async function SubmitBatch(batch, token: string, username: string, password: string) {
	// We will need token, username and password to authenticate with the server each time we want to request a new batch or submit a result.
	const request = await fetch("http://porn-search.me/api/worker/submit-batch.php", {
		method: "POST",
		body: JSON.stringify({
			token: token,
			username: username,
			password: password,
			result: batch
		})
	})

	const response = (await request.json() as Response);
	if (response.status === "error") {
		error(response.value);
	} else {
		info("Successfully submitted batch containing " + batch.length + " results.");
	}
} 