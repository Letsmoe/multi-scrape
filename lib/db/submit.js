import { info, error } from "../output.js";
import fetch from 'node-fetch';
export async function SubmitBatch(batch, token, username, password) {
    const request = await fetch("http://porn-search.me/api/worker/submit-batch.php", {
        method: "POST",
        body: JSON.stringify({
            token: token,
            username: username,
            password: password,
            result: batch
        })
    });
    const response = await request.json();
    if (response.status === "error") {
        error(response.value);
    }
    else {
        info("Successfully submitted batch containing " + batch.length + " results.");
    }
}
