import * as cheerio from "cheerio";
export default {
	accessFrequency: 30,
	key: "pornhub",
	server: "pornhub.com",
	url: "https://pornhub.com",
	checkOverview: (url: string) => {
		return !/.*?\view_video\.php/.test(url);
	},
	overview: {
		results: ($: cheerio.CheerioAPI) => {
			// Return all links to subpages on the overview page.
			let urls = [];
			$(".phimage > a").each((i, elem) => {
				const url = $(elem).attr("href");
				if (url) {
					let thumbs = [$(elem).find("img").attr("data-src")];
					urls.push({
						url: url,
						thumbnails: thumbs,
					});
				}
			});
			return urls;
		},
	},
	video: {
		title: ($: cheerio.CheerioAPI) => {
			return $("h1.main-h1").text().trim();
		},
		len: ($: cheerio.CheerioAPI) => {
			const timeString = $(".meta > .icon.fa-clock-o").text();
			// Time string is in this format: 1h 37m 45s or 24m 45s, we want to get the number of seconds from that
			let seconds = 0;
			timeString.match(/([0-9]+([m|h|s]))/g).forEach((match) => {
				const number = match.match(/([0-9]+)/)[0];
				const unit = match.match(/([m|h|s])/)[0];
				switch (unit) {
					case "m":
						seconds += parseInt(number) * 60;
						break;
					case "h":
						seconds += parseInt(number) * 60 * 60;
						break;
					case "s":
						seconds += parseInt(number);
						break;
				}
			});
			return seconds;
		},
		actors: ($: cheerio.CheerioAPI) => {
			const actors = [];
			$(".meta > .icon.fa-star-o")
				.find("a")
				.each((i, el) => {
					actors.push({
						name: $(el).text(),
						url: $(el).attr("href"),
					});
				});
			return actors;
		},
		tags: ($: cheerio.CheerioAPI) => {
			const tags = [];
			$("section > p > a").each((i, el) => {
				tags.push({
					name: $(el).text(),
				});
			});
			return tags;
		},
	},
};
