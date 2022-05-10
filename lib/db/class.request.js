import configFiles from "../configs/index.js";
import * as path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
export class Request {
    constructor(job) {
        this.onComplete = () => { };
        this.fetch(job);
    }
    async fetch(job) {
        const request = await fetch(job.url);
        const content = await request.text();
        let result = this.analyze(content, job.url);
        if (result) {
            result.hash = job.hash;
            this.onComplete({
                status: "success",
                value: result
            });
        }
        else {
            this.onComplete({
                status: "error",
                value: null
            });
        }
    }
    analyze(content, job) {
        for (const config of configFiles) {
            if (new RegExp(config.server).test(new URL(job).hostname)) {
                const $ = cheerio.load(content);
                if (config.checkOverview(job)) {
                    const overview = config.overview.results($);
                    const links = overview;
                    return {
                        type: "overview",
                        links: links.map((x) => {
                            return {
                                url: correctPath(config.server, job, x.url),
                                thumbnails: x.thumbnails.map((thumb) => correctPath(config.server, job, thumb)),
                            };
                        }),
                    };
                }
                else {
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
                    };
                }
            }
        }
        this.onError(new Error("No matching config found for: " + job));
    }
}
function correctPath(hostname, parentUrl, url) {
    if (url.startsWith("//")) {
        return `https:${url}`;
    }
    else if (url.startsWith("/")) {
        return `https://${hostname}${url}`;
    }
    else if (url.startsWith("http")) {
        return url;
    }
    else {
        return path.join(parentUrl, url);
    }
}
