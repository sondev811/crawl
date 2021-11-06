import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";

const type = {
    link: 'link'
}
class CrawlData {
    async crawl(url, typeCrawl) {
        try {
            const res = await fetch(url);
            const html = await res.text();
            if (!html) {
                return;
            }
            const $ = cheerio.load(html);
            if (typeCrawl === type.link) {
                const realLinks = [];
                const links = $("#news-latest").find("a").map((i, link) => link.attribs.href).get();
                links && links.length && links.map((value) => {
                    realLinks.push({link: `https://zingnews.vn/${value}`});
                });
                const uniqueLinks = realLinks && realLinks.length && realLinks.filter((v, i, a)=> a.findIndex(t => (t.link === v.link)) === i);
                return uniqueLinks;
            }
            const header = $(".the-article-title").text();
            const title = $(".the-article-summary").text();
            const content = [];
            $(".page-wrapper .main .the-article-body").children().map((index, item) => {
                let tagName = $(item).get(0).tagName;
                let data = $(item).text().trim();
                if ($(item).get(0).tagName === 'table') {
                    tagName = 'img';
                    let textImage = $(item).find('p').text();
                    if (textImage) {
                        tagName = ['img', 'p'];
                        data = {src: $(item).find('img').attr('data-src'), textImage};
                    }
                }
                content.push({ tagName, index, data });
            }).get();
            return {url, header, title, content};
        } catch (error) {
            console.log(error);        
        }
    }
    
    async run() {
        try {
            fs.readFile("url.json",'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (!data) {
                    return;
                }
                const parsedData = JSON.parse(data);
                parsedData && parsedData.length && parsedData.forEach(async item => {
                    const result = [];
                    let links = [];
                    if (!item || !item.url) {
                        return;
                    }
                    links = await this.crawl(item.url, type.link);
                    if (!links || !links.length) {
                        return;
                    }
                    await links.forEach(async childItem => {
                        const data = await this.crawl(childItem.link, type.new);
                        result.push(data);
                        fs.writeFile(`crawledData_zingnews_${item.category}.json`, JSON.stringify(result), 'utf8', err => {
                            if (err) throw err;
                            console.log(`Saved: ${childItem.link}`);
                        });
                    });
                });
            });
        } catch (error) {
            console.log(error);
        }
    }

}

const crawlData = new CrawlData;
crawlData.run();