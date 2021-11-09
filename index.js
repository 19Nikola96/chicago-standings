import puppeteer from 'puppeteer'
import express from 'express'
import { writeFileSync } from 'fs'
import schedule from 'node-schedule'
import cors from 'cors'

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const Standings = require("./data/standings.json") // use the require method

let port = process.env.PORT || 5000;

const app = express();

app.use(
    cors({
        origin: "*",
    })
)

app.use(express.json());

const scrapData = async () => {
    console.log('Scrapping');
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36')
    await page.goto('https://www.nba.com/standings') 
    const standings = await page.evaluate(() => {
        let standings = []
        let teams = document.querySelectorAll('tbody tr')
        teams.forEach((team)=> {
            standings.push({ 
                teamPosition: team.querySelector('td div div .t3')?.textContent,
                teamImg: team.querySelector('td div a div img')?.src,
                teamName: team.querySelector('td div .ml-2 a')?.textContent,          
                teamWin: team.querySelector('td:nth-of-type(2)')?.textContent,          
                teamLoose: team.querySelector('td:nth-of-type(3)')?.textContent,          
                winRate: team.querySelector('td:nth-of-type(4)')?.textContent,          
            })
        });

        return standings
    })

    const tryOutData = [
        { 
            playerName: 'Stephen Curry',
            playerAverage: '28pts'
        },
        { 
            playerName: 'Jimmy Buttler',
            playerAverage: '23pts'
        },
    ]

    writeFileSync('./data/standings.json', JSON.stringify(standings))

    await browser.close();
}

const job = schedule.scheduleJob('08 * * * *', scrapData);

app.get('/', (req, res) => {
    res.send('Hello API')
});

// app.post('/standings', (req, res) => {    
//     scrapData(res)
//     // res.status(401).send("User does not a-have permission")
// })

app.get('/standings', (req, res) => {
    res.json(Standings)
});

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
