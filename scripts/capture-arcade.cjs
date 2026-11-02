'use strict';
const {chromium}=require('playwright');const {mkdir,readFile,writeFile}=require('node:fs/promises');const {createHash}=require('node:crypto');const path=require('node:path');
(async()=>{const output=process.env.CAPTURE_OUTPUT||'/tmp/atelier-captures',site=process.env.CAPTURE_SITE||'capture-site';await mkdir(output,{recursive:true});const inputs={};for(const f of ['index.html','styles.css','engine.js','game.js','icon.svg'])inputs[f]=createHash('sha256').update(await readFile(path.join(site,f))).digest('hex');const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,locale:'en-US',reducedMotion:'reduce'});await page.addInitScript(()=>{let seed=1989;Math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;});await page.goto('http://127.0.0.1:4183/',{waitUntil:'domcontentloaded'});
 await page.locator('#player-count').selectOption('2');await page.locator('#start').click();await page.locator('#play-area').waitFor({state:'visible'});
 for(const color of ['pearl','azure','jade'])await page.locator(`#gem-${color}`).click();
 await page.locator('.table-layout').screenshot({path:path.join(output,'atelier-01.png'),animations:'disabled'});
 await page.locator('#take').click();await page.waitForTimeout(1200);await page.locator('#market .plan').first().click();await page.locator('#card-dialog').waitFor({state:'visible'});await page.screenshot({path:path.join(output,'atelier-02.png'),animations:'disabled'});
 await writeFile(path.join(output,'capture.json'),JSON.stringify({schemaVersion:1,workflowCommit:process.env.GITHUB_SHA||null,sourceCommit:process.env.GAME_SOURCE_COMMIT||null,runId:process.env.GITHUB_RUN_ID||null,url:'http://127.0.0.1:4183/',inputs,browser:browser.version(),viewport:{width:1440,height:1000},seed:1989,screenshots:['atelier-01.png','atelier-02.png']},null,2)+'\n');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
