import * as puppeteer from 'puppeteer';

let browserPromise: Promise<puppeteer.Browser>
let pagePromise: Promise<puppeteer.Page>

// export async function startMsxBrowser(): Promise<puppeteer.Page> {
//     if (browserPromise !== undefined) {
//         const browser = await browserPromise
//         if (browser.process() != null && browser.isConnected()) {
//             console.log("Found connected browser")
//             return pagePromise
//         } else {
//             try {
//                 console.log("Found browser but either the process had gone, or it wasn't connected")
//                 browser.close()
//             } catch { }
//         }
//     }
//     browserPromise = puppeteer.launch({
//         headless: false,
//         executablePath:
//             process.platform === 'darwin'
//                 ? '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
//                 : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
//         args: [
//             '--no-sandbox',
//         ],
//         dumpio: true
//     })
//     pagePromise = browserPromise
//         .then(async browser => {
//             const page = await browser.newPage();
//             await page.goto('https://microsoftsales.crm.dynamics.com/main.aspx');
//             await page.goto('https://microsoftsales.crm.dynamics.com/main.aspx');
//             await page.waitForSelector('#GlobalSearchBox', {
//                 timeout: 60000
//             });
//             return page;
//         }).then(page => {
//             console.log('Browser is ready to server requests')
//             return page
//         });

//     return pagePromise
// }



//need to limit the amount of times we call through here to avoid throttling.
export async function fetch<T>(pageFunction: (filter: string) => T, filter: string) {

    return pageFunction(filter)
}
