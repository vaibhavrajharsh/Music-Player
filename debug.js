const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.toString()));
  
  await page.goto('http://127.0.0.1:5500/index.html', {waitUntil: 'networkidle0'});
  await new Promise(r => setTimeout(r, 2000)); // wait for loads
  
  const cardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
  const cardHtml = await page.evaluate(() => document.querySelector('.card') ? document.querySelector('.card').outerHTML : 'no cards');
  const cardStyles = await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (!card) return null;
    return {
      display: getComputedStyle(card).display,
      visibility: getComputedStyle(card).visibility,
      width: getComputedStyle(card).width,
      height: getComputedStyle(card).height
    };
  });
  
  console.log(JSON.stringify({errors, cardCount, cardStyles}));
  console.log(cardHtml);
  
  await browser.close();
})();
