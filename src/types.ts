export type Response = {status: "error" | "success", value: any};
export type BatchJob = {
	url: string,
	hash: string,
	type: "video" | "overview"
}

export type RequestResult = {
	type: "overview" | "video",
	links: {url: string, thumbnails: string[]}[],
}