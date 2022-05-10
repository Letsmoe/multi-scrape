import fetch from "node-fetch";

async function fetchPage(url: string) {
	const response = await fetch(url);
	const text = await response.text();
	return text;
}

export { fetchPage };
