import fetch from "node-fetch";
import cheerio from "cheerio";
import fs, { writeFile } from "fs";
import http from "http"; 
import https from "https"; 
import {Transform} from "stream";
import fse from 'fs-extra'; 

const WS = {
    zing: 'zing',
    cafeF: 'cafef',
    cafeBiz: 'cafebiz',
}
export class CrawlData {
    async crawl(url, web) {
        try {
          const res = await fetch(url);
          const html = await res.text();
          if (!html) {
              return;
          }
          const $ = cheerio.load(html);

          //get all link of category 
          // if (typeCrawl === type.link) {
          //     const realLinks = [];
          //     const links = $("#news-latest").find("a").map((i, link) => link.attribs.href).get();
          //     links && links.length && links.map((value) => {
          //         realLinks.push({link: `https://zingnews.vn/${value}`});
          //     });
          //     const uniqueLinks = realLinks && realLinks.length && realLinks.filter((v, i, a)=> a.findIndex(t => (t.link === v.link)) === i);
          //     return uniqueLinks;
          // }
          switch (web) {
            case WS.zing:
              return this.zing($, url);
            case WS.cafeF:
              return this.cafeF($, url);
            case WS.cafeBiz:
              return this.cafeBiz($, url);
            default:
              return this.zing($, url);
          }
            
        } catch (error) {
            console.log(error);        
        }
    }

    randomName(length) {
      let result           = '';
      let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *  charactersLength));
      }
     return result;
  }

    async zing($, url) {
      const header = $(".the-article-title").text();
      const title = $(".the-article-summary").text();
      const tags = [];
      const content = [];
      $(".page-wrapper .main .the-article-body").children().map((index, item) => {
        let tagName = $(item).get(0).tagName;
        let data = $(item).text().trim();
        if ($(item).get(0).tagName === 'table') {
            tagName = 'img';
            let textImage = $(item).find('p').text();
            if (textImage) {
              tagName = ['img', 'p'];
              const imageUrl = $(item).find('img').attr('data-src');
              if (imageUrl) {
                const imageName = `zing_${this.randomName(12)}.${this.getTypeImage(imageUrl)}`;
                this.downloadImage(imageUrl, imageName);
                data = {src: imageName, textImage};
              }
            }
        }
        if ($(item).get(0).tagName === 'figure') {
          tagName = 'figure';
          const src = $(item).get(0).attribs['data-video-src'];
          const figcaption = $(item).find('figcaption').text();
          data = {
            src, figcaption
          }
        }
        if ($(item).get(0).tagName === 'video') {
          tagName = 'video';
          data = $(item).get(0).attribs.src;
        }
        content.push({ tagName, index, data });
      }).get();
      $(".page-wrapper .main .the-article-tags").children().map((index, item) => {
        const tagData = $(item).find('.tag-item').prevObject.get(0).children[0].data;
        tags.push(tagData);
      }).get();
      return {url, header, title, content, tags};
    }

    async cafeF($, url) {
      let header = $('.totalcontentdetail h1').text();
        header = header.replace(/\s+/g, ' ').trim();
        let title = $('.totalcontentdetail .sapo').text();
        title = title.replace(/\s+/g, ' ').trim();
        const avatar = $('.media img').attr('src');
        const avatarDes = $('.media .avatar-des').text().trim();
        let textImage = avatarDes || '';
        const content = [];
        const tags = [];
        if (avatar) {
          const imageName = `cafeF_${this.randomName(12)}.${this.getTypeImage(avatar)}`;
          this.downloadImage(avatar, imageName);
          content.push({
            tagName: [
              'img',
              'p'
            ],
            index: 0,
            data: {
              src: imageName,
              textImage
            }
          })
        }
        $('#mainContent').children().map((index, item) => {
          let tagName = $(item).get(0).tagName;
          if (tagName === 'p' || tagName === 'div' || tagName === 'table') {
            let data = $(item).text().trim();
            if (($(item).get(0).tagName === 'div' || $(item).get(0).tagName === 'table') && 
            $(item).find('img').length) {
                tagName = 'img';
                data = $(item).find('img').attr('src');
                const textImage = $(item).find('img').attr('title');
                if (textImage && data) {
                  tagName = ['img', 'p'];
                  const imageName = `cafeF_${this.randomName(12)}.${this.getTypeImage(data)}`;
                  this.downloadImage(data, imageName);
                  data = {src: imageName, textImage};
                }
            }
            if (data && tagName !== 'div') {
              content.push({ tagName, index: index + 1, data });
            }
          }
        }).get();

        $('.tagdetail').children().get(1).children.map((item) => {
          if (item && item.name === 'a') {
            tags.push(item.children[0].data);
          }
        });
        return {url, header, title, content, tags};
    }

    async cafeBiz($, url) {
      let header = $('.newscontent h1').text();
        header = header.replace(/\s+/g, ' ').trim();
        let title = $('.newscontent .sapo').text();
        title = title.replace(/\s+/g, ' ').trim();
        const avatar = $('.newscontent .dtavatar img').attr('src');
        const avatarDes = $('.newscontent .avatar-desc').text().trim();
        let textImage = avatarDes || '';
        const content = [];
        const tags = [];
        if (avatar) {
          const imageName = `cafeBiz_${this.randomName(12)}.${this.getTypeImage(avatar)}`;
          this.downloadImage(avatar, imageName);
          content.push({
            tagName: [
              'img',
              'p'
            ],
            index: 0,
            data: {
              src: imageName,
              textImage
            }

          })
        }
        $('.detail-content').children().map((index, item) => {
          let tagName = $(item).get(0).tagName;
          if (tagName === 'p' || tagName === 'div') {
            let data = $(item).text().trim();
            if ($(item).get(0).tagName === 'div' && $(item).find('img').length) {
                tagName = 'img';
                data = $(item).find('img').attr('src');
                const textImage = $(item).find('img').attr('title');
                if (textImage && data) {
                  tagName = ['img', 'p'];
                  const imageName = `cafeBiz_${this.randomName(12)}.${this.getTypeImage(data)}`;
                  this.downloadImage(data, imageName);
                  data = {src: imageName, textImage};
                }
            }
            if (data && tagName !== 'div') {
              content.push({ tagName, index: index + 1, data });
            }
          }
        }).get();
        $('.tags-item').children().map((index, item) => {
          tags.push($(item).text());
        }).get();
        content.splice(-1);
        return {url, header, title, content, tags};
    }

    getTypeImage(url) {
      if (!url) return '';
      const type = url.split('.').pop();
      return type;
    }

    async downloadImage(url, imageName) {
      if (!url) return;
      let client = http;
      if (url.toString().indexOf("https") === 0){
        client = https;
      }
      client.request(url, function(response) {                                        
        var data = new Transform();                                                    
      
        response.on('data', function(chunk) {                                       
          data.push(chunk);                                                         
        });                                                                         
        
        response.on('end', function() {                                             
          fs.writeFileSync(`./public/${imageName}`, data.read());                               
        });                                                                         
      }).end();
    };
    
    async run() {
      try {
        const data = fs.readFileSync("url.json", 'utf8');
        if (!data) {
          throw new Error('File url.json is empty');
        }
        const parsedData = JSON.parse(data);
        const result = await Promise.all(parsedData && parsedData.length && parsedData.map(async (item) => {
          if (!item || !item.url) {
            throw new Error('File url.json is empty');
          }
          const data = await this.crawl(item.url, item.web);
          return data;
        }));
        fse.removeSync('public');
        fs.mkdirSync('public');
        fs.writeFileSync("crawledData.json", JSON.stringify(result), {encoding: "utf8"});
        return {
          status: true
        };
      } catch (error) {
        return {
          status: false
        };
      }
    }
}