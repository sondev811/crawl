import { path } from "chromedriver";
import WebDriver  from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import 'dotenv/config';
import { By, Key } from 'selenium-webdriver';
import fs from 'fs';
const chromeOptions = new chrome.Options();
const url = process.env.URL;
const userName = process.env.USERNAMEWP;
const password = process.env.PASSWORDWP;
const openPostTab = '.dashicons-admin-post';
const createPost = '.page-title-action';
const closePostTab = '.edit-post-fullscreen-mode-close'
const addBlock = '.edit-post-header-toolbar__inserter-toggle';
const imageBlock = '.editor-block-list-item-image';
const videoBlock = '.editor-block-list-item-video';
const insertUrl = '.block-editor-media-placeholder__url-input-container';
const paragraph = '.block-editor-rich-text__editable.is-selected';
const urlInputImageAndVideo = '.block-editor-media-placeholder__url-input-field';
const imageNote = '.block-editor-block-list__block.is-selected figcaption';
const saveDraft = '.editor-post-save-draft';
const uploadImage = '.components-form-file-upload input';
const imageDir = (imageName) => {
  return `E:/Workspace/crawl-data/public/${imageName}`;
}

let driver = null;

const init = async () => {
  driver = new WebDriver.Builder()
             .forBrowser("chrome")
             .setChromeOptions(chromeOptions).build();
}

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const login = async () => {
  const userNameInput = await driver.findElement(By.name('log'));
  await sleep(200);
  await userNameInput.sendKeys(userName);
  const passwordInput = await driver.findElement(By.name('pwd'));
  await sleep(200);
  await passwordInput.sendKeys(password);
  const loginBtn = await driver.findElement(By.id('wp-submit'));
  await loginBtn.click();
}

const handleAddContent = async (data) => {
  if (!data || !data.header || !data.title || !data.content || data.content.length < 0) return;
  const title = await driver.findElement(By.css('.editor-post-title__input'));
  await sleep(1000);
  await title.sendKeys(data.header);
  await title.sendKeys(Key.ENTER);
  await addParagraph(paragraph, data.title, true);
  for (const item of data.content) {
    if (typeof item.tagName === 'object' && item.data.src) {
      await addImage(item.data.src, item.data.textImage);
    }
    if (item.tagName === 'p') {
      await addParagraph(paragraph, item.data);
    } 
    if (item.tagName === 'figure') {
      await addVideo(item.data.src, item.data.figcaption, true);
    }
    if (item.tagName === 'video') {
      await addVideo(item.data);
    }
  }
}

const addTag = async (tags) => {
  if (!tags || !tags.length) return;
  await onClickButton('.interface-pinned-items');
  await onClickButton('.components-panel__header.interface-complementary-area-header.edit-post-sidebar__panel-tabs ul li:nth-child(1)');
  await onClickButton('.components-panel__body:nth-child(5)');
  for (const tag of tags) {
    await addParagraph('.components-panel__body:nth-child(5) input', tag);
    await sleep(200);
  }
}

const onClickButton = async (className) => {
  await sleep(1000);
  const button = await driver.findElement(By.css(className));
  await sleep(1000);
  await button.click();
}

const addParagraph = async (className, content, isTitle=false) => {
  const input = await driver.findElement(By.css(className));
  await sleep(500);
  await input.sendKeys(content);
  if (isTitle) {
    await input.sendKeys(Key.chord(Key.CONTROL, "a"));
    await onClickButton('.components-toolbar-button');
    await input.sendKeys(Key.ARROW_RIGHT);
  }
  await input.sendKeys(Key.ENTER);
}

const addImage = async (fileName, note='') => {
  await onClickButton(addBlock);
  await onClickButton(imageBlock);
  const input = await driver.findElement(By.css(uploadImage));
  await input.sendKeys(imageDir(fileName));
  await sleep(1000);
  if (note) {
    await addParagraph(imageNote, note);
  } else {
    const input = await driver.findElement(By.css(imageNote));
    await sleep(500);
    await input.sendKeys(Key.ENTER);
  }
}

const addVideo = async (url, note='', hasFigcaption=false) => {
  await onClickButton(addBlock);
  await onClickButton(videoBlock);
  await onClickButton(insertUrl);
  await addParagraph(urlInputImageAndVideo, url);
  if (hasFigcaption) {
    await addParagraph(imageNote, note);
  }
}

const createNewPost = async (index) => {
  const createPostBtn = await driver.findElement(By.css(createPost));
  await sleep(200);
  await createPostBtn.click();
  await sleep(1500);
  if (index === 0) {
    driver.findElement(By.tagName("body")).sendKeys(Key.ESCAPE);
    await sleep(100);
  }
}

const readJSON = async () => {
  try {
    const fileName = './crawledData.json';
    return JSON.parse(fs.readFileSync(fileName, 'utf8'));
  } catch (error) {
    return [];
  }
 };

export const execute = async () => {
  console.log('start bot');
  const data = await readJSON();
  if (!data || !data.length) return;
  await init();
  await driver.get(url);
  await sleep(1000);
  await login();
  await sleep(1000);
  await onClickButton(openPostTab);
  await sleep(2000);

  let index = 0;
  for (const item of data) {
    await createNewPost(index);
    await handleAddContent(item);
    await addTag(item.tags);
    await onClickButton(saveDraft);
    await onClickButton(closePostTab);
    index++;
  }
}
