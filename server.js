import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import { CrawlData } from './crawlData.js';
import { execute } from './post.js';
const app = express()
const port = 5000;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/getData', async (req, res) => {
  try {
    await fs.readFile("url.json",'utf8', async (err, data) => {
      if (err) {
        res.sendStatus(500).send([]);
      };
      if (!data) {
        res.sendStatus(500).send([]);
      }
      res.status(200).send(JSON.parse(data));
    });
  } catch (error) {
    res.sendStatus(500).send([]);
  }
})

app.post('/postData', async (req, res) => {
  if (!req || !req.body || !req.body.url || !req.body.web) {
    res.sendStatus(404).send([]);
  }
  await fs.readFile("url.json",'utf8', async (err, data) => {
    if (err) {
      res.sendStatus(500).send([]);
    };
    if (!data) {
      res.sendStatus(500).send([]);
    }
    const parsedData = JSON.parse(data);
    parsedData.unshift(req.body);
    fs.writeFile(`url.json`, JSON.stringify(parsedData), 'utf8', err => {
      if (err) throw err;
      res.status(200).json(parsedData);
    });
  });
})

app.post('/deleteData', async (req, res) => {
  if (!req || !req.body || !req.body.url || !req.body.web) {
    res.sendStatus(404).send([]);
  }
  await fs.readFile("url.json",'utf8', async (err, data) => {
    if (err) {
      res.status(500).json({});
    };
    if (!data) {
      res.status(500).json({});
    }
    const parsedData = JSON.parse(data);
    const index = parsedData.findIndex(item => item.url === req.body.url && item.web === req.body.web);
    if (index === -1) {
      res.sendStatus(404).send([]);
    }
    parsedData.splice(index, 1);
    fs.writeFile(`url.json`, JSON.stringify(parsedData), 'utf8', err => {
      if (err) throw err;
      res.status(200).json(parsedData);
    });
  });
});

app.get('/crawl', async (req, res) => {
  try {
    const crawl = new CrawlData();
    const result = await crawl.run();
    if (!result.status) throw new Error('Crawl failed');
    res.status(200).send({status: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
})

app.get('/startBot', async (req, res) => {
  try {
    execute();
    res.status(200).send({status: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})