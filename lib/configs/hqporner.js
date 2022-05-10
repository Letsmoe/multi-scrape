export default {
    accessFrequency: 30,
    key: "hqporner",
    server: "hqporner.com",
    url: "https://hqporner.com",
    checkOverview: (url) => {
        return !/.*?\.html/.test(url);
    },
    overview: {
        results: ($) => {
            let urls = [];
            $(".w403px").each((i, elem) => {
                let parent = elem.parent;
                const url = $(parent).attr("href");
                if (url) {
                    let thumbs = [];
                    $(parent)
                        .find(".hide_noscript")
                        .each((i, image) => {
                        const imageUrl = $(image)
                            .attr("onmouseover")
                            .match(/changeImage\("(.*?)"/)[1];
                        if (imageUrl) {
                            thumbs.push(imageUrl);
                        }
                    });
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
        title: ($) => {
            return $("h1.main-h1").text().trim();
        },
        len: ($) => {
            const timeString = $(".meta > .icon.fa-clock-o").text();
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
        actors: ($) => {
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
        tags: ($) => {
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
