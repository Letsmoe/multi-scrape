import { BatchJob } from "../types.js";
import configFiles from "../configs/index.js";
import * as path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export class Request {
	public onComplete: Function = () => {};
	public onError: Function;

	constructor(job: BatchJob) {
		// We received a new job, fetch the url and analyze it.
		this.fetch(job);
	}

	private async fetch(job: BatchJob) {
		// Fetch the url
		const request = await fetch(job.url);
		const content = await request.text();
		// Analyze the url
		let result = this.analyze(content, job.url) as any;
		// Call the callback
		if (result) {
			result.hash = job.hash;
			this.onComplete({
				status: "success",
				value: result
			});
		} else {
			this.onComplete({
				status: "error",
				value: null
			})
		}
	}

	private analyze(content: string, job: string) {
		// Analyze the url
		// Loop through the configs and find the one with a matching server
		for (const config of configFiles) {
			// Match the server property to the jobs server
			if (new RegExp(config.server).test(new URL(job).hostname)) {
				// Make a new cheerio instance for the result string
				const $ = cheerio.load(content);
				// Check if the overview page is the one we want to parse
				if (config.checkOverview(job)) {
					// Parse the overview page
					const overview = config.overview.results($);
					// Store the links
					const links = overview;
					return {
						type: "overview",
						links: links.map((x) => {
							return {
								url: correctPath(config.server, job, x.url),
								thumbnails: x.thumbnails.map((thumb: string) =>
									correctPath(config.server, job, thumb)
								),
							};
						}),
					}
				} else {
					// Parse the video page
					const video = config.video;
					let title = video.title($);
					let length = video.len($);
					let actors = video.actors($);
					let tags = video.tags($);
					return {
						type: "video",
						title: title,
						length: length,
						actors: actors,
						tags: tags,
						url: job
					}
				}
			}
		}
		// We didn't find a matching config, issue a callback
		this.onError(new Error("No matching config found for: " + job));
	}
}

/**
 * A function to correct a path, based on the hostname, the parent url, and the given path
 * @date 4/30/2022 - 2:53:19 PM
 */
function correctPath(hostname: string, parentUrl: string, url: string) {
	if (url.startsWith("//")) {
		// Basically a full url, but missing the "https" in front of it.
		return `https:${url}`;
	} else if (url.startsWith("/")) {
		// Go from the root of the domain
		return `https://${hostname}${url}`;
	} else if (url.startsWith("http")) {
		return url
	} else {
		// Go from the parent url
		return path.join(parentUrl, url);
	}
}