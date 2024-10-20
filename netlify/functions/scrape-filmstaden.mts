import type { Browser, HTTPResponse, Page } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import chromium from '@sparticuz/chromium-min'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import {
  FilmstadenMovieJson,
  FilmstadenService,
  FilmstadenShowtimesJson
} from '../shared/services/filmstaden.service'
import { LogService } from '../shared/logs/log.service'
import { NetlifyStore } from '../shared/store/netlify.store'
import { MovieService } from '../shared/movies/movie.service'
import { ShowtimeService } from '../shared/showtimes/showtime.service'
import { Config } from '@netlify/functions'

import 'puppeteer-extra-plugin-stealth/evasions/chrome.app'
import 'puppeteer-extra-plugin-stealth/evasions/chrome.csi'
import 'puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes'
import 'puppeteer-extra-plugin-stealth/evasions/chrome.runtime'
import 'puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow'
import 'puppeteer-extra-plugin-stealth/evasions/media.codecs'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.languages'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.permissions'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.plugins'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.vendor'
import 'puppeteer-extra-plugin-stealth/evasions/navigator.webdriver'
import 'puppeteer-extra-plugin-stealth/evasions/sourceurl'
import 'puppeteer-extra-plugin-stealth/evasions/user-agent-override'
import 'puppeteer-extra-plugin-stealth/evasions/webgl.vendor'
import 'puppeteer-extra-plugin-stealth/evasions/window.outerdimensions'
import 'puppeteer-extra-plugin-stealth/evasions/defaultArgs'
import 'puppeteer-extra-plugin-user-preferences/index'
import 'puppeteer-extra-plugin-user-data-dir/index'

puppeteer.use(StealthPlugin())

async function visitUpcomingMovies(
  page: Page
): Promise<[FilmstadenMovieJson | null, string | null]> {
  let json: FilmstadenMovieJson | null = null

  async function catchJson(response: HTTPResponse) {
    const request = response.request()
    console.log('url', request.url())
    if (
      request.method() === 'GET' &&
      request
        .url()
        .includes(
          'https://services.cinema-api.com/movie/upcoming/sv/1/1024/false'
        )
    ) {
      json = await response.json()
    }
  }

  page.on('response', catchJson)

  await page.goto('https://www.filmstaden.se/kommande-filmer/', {
    waitUntil: ['domcontentloaded', 'networkidle0']
  })

  const movieLinks = await page.$$('a[href^="/film"]')

  const handle = await movieLinks.slice(2)[0].getProperty('href')
  const movieLink = await handle.jsonValue()

  page.off('response', catchJson)

  return [json, movieLink]
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function visitMovieLink(
  page: Page,
  link: string
): Promise<FilmstadenShowtimesJson | null> {
  let json = null

  await page.setViewport({ width: 1280, height: 720 })

  async function catchJson(response: HTTPResponse) {
    const request = response.request()
    console.log('url', request.url())
    if (
      request.method() === 'GET' &&
      request
        .url()
        .includes(
          'https://services.cinema-api.com/show/stripped/sv/1/1024/?CountryAlias=se&CityAlias=MA&Channel=Web'
        )
    ) {
      json = await response.json()
    }
  }

  page.on('response', catchJson)

  await page.goto(link, {
    waitUntil: ['domcontentloaded', 'networkidle0']
  })

  await wait(5000)

  page.off('response', catchJson)

  return json
}

async function getBrowser(): Promise<Browser> {
  const isLocal = process.env.NETLIFY_DEV === 'true'

  if (isLocal) {
    return await puppeteer.launch()
  } else {
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar'
      ),
      headless: true
    })
  }
}

async function visitMainPage(page: Page) {
  await page.goto('https://www.filmstaden.se/malmo', {
    waitUntil: ['domcontentloaded', 'networkidle0']
  })

  await page.evaluate(() => {
    window.localStorage.setItem(
      'city',
      '{"contentful_id":"3E7K3xNboC4RJ1n6QjoPp3","__typename":"ContentfulCity","city":{"alias":"MA","name":"Malmö","latitude":55.60498,"longitude":13.00382},"theme":{"__typename":"ContentfulTheme","contentful_id":"6kXB1MuS2w41botOjODRLx","type":"filmstaden","variant":"dark"},"cityPage":{"__typename":"ContentfulContentPage","contentful_id":"2pK6NVYcCDZ5Vss8V2B7Jx","slug":"/malmo/","title":"Filmstaden i Malmö - Film är bäst på bio"},"cinemaPage":{"__typename":"ContentfulWebPageUrl","contentful_id":"QnRDiNDPAIJnsERKERcOK","variant":"none","urlName":"Biografer","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"EQo0k8SW6lVSlKLQiI5v1","slug":"/bio-i-malmo/","title":"Gå på bio i Malmö - Filmstadens biografer i Malmö"}],"externalUrl":null,"image":null,"target":null},"navigation":{"__typename":"ContentfulMainNavigation","contentful_id":"3H3bBlag2ALONzy9yYRE1Q","logotype":{"__typename":"ContentfulAsset","contentful_id":"2RUuxF1h5556yOB2BV9c97","description":"temp logotype","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/2RUuxF1h5556yOB2BV9c97/a1328248232c98c32f011ecf3cd65897/temp_logo_filmstaden.svg","details":{"image":{"height":32,"width":146}}}},"homeLink":{"__typename":"ContentfulWebPageUrl","contentful_id":"3a1KLUiiTpA0ZpH1tmEGcU","variant":"none","urlName":"Upptäck","internalUrl":null,"externalUrl":null,"image":{"__typename":"ContentfulAsset","contentful_id":"6AuCsfUPjMIKiEonUikR1","description":"","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/6AuCsfUPjMIKiEonUikR1/45003de96e7a5836284e86a5244906df/uppt_ck.svg","details":{"image":{"height":25,"width":24}}}},"target":null},"linkLists":[{"__typename":"ContentfulShortcutsBlock","contentful_id":"uTqoqrNeNZlwh8ByFTUIY","shortcutsHeading":"Gå på bio","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"4aTc4WcIn9qyddB2ozl7el","variant":"none","urlName":"På bio nu","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2WkO4DqHw0pdQbatRynwAb","slug":"/pa-bio-nu/","title":"På bio nu - Upptäck vilka nya biofilmer som går på Filmstaden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"40KpCBRbCCx4h5dDqZnXrd","variant":"none","urlName":"Kommande filmer","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"5kS7C3EaBvtYdbeIx2zhoJ","slug":"/kommande-filmer/","title":"Kommande filmer på bio - Filmer som kommer"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"49CnBEmZclNXlI8drr2Nvq","variant":"none","urlName":"Barn och familj","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3BsCq1cQPeg8uwfTDK65g","slug":"/familj/","title":"Familjebio hos Filmstaden - Upptäck film med hela familjen"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"4I8bLd9uwYXJvO0xfmAr98","variant":"none","urlName":"Bioupplevelsen","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2snd8izeRyOrOErjWz7c4k","slug":"/bioupplevelsen/","title":"Bioupplevelsen"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null},{"__typename":"ContentfulShortcutsBlock","contentful_id":"4lebU2QOVJSSSsYk54CEsK","shortcutsHeading":"Medlem","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"3y9Iee6nAdjUUCb1RrNOZq","variant":"none","urlName":"Logga in","internalUrl":null,"externalUrl":"https://services.cinema-api.com/redirect/externalSignUpOrIn/se?redirectUrl=https://www.filmstaden.se/mina-sidor/","image":null,"target":"_self"},{"__typename":"ContentfulWebPageUrl","contentful_id":"2RbP3NxkfhDTv0gE6RYwov","variant":"none","urlName":"Bli medlem","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"23fRSqDRGXFpv1xDS1ZbAF","slug":"/medlem/","title":"Filmstadens medlemskap - Tjäna poäng på ditt biobesök"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null},{"__typename":"ContentfulShortcutsBlock","contentful_id":"2mSoVQKtRL70eEUcTOVdLM","shortcutsHeading":"Mer","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"3ciylhvq6BvKfDLYsWz2dp","variant":"none","urlName":"Erbjudanden","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"1F1dtOKwZgYWbvpuqueuvR","slug":"/erbjudanden/","title":"Erbjudanden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"21se9E2J7dRgQcU5ZDmWDb","variant":"none","urlName":"Presentkort","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"6mfFBYLRiPAlUdZzWhm33Z","slug":"/presentkort/","title":"Presentkort"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"5mr33RremcjRx8bja4p9ZT","variant":"none","urlName":"Mat och dryck","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"54cTCbayr7EmJHAk54xJYo","slug":"/mat-och-dryck/","title":"Mat och dryck"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"1a9LN9UmeScrmbXMVHiJyh","variant":"none","urlName":"Nyheter","internalUrl":[{"__typename":"ContentfulNewsArticlesPage","contentful_id":"4c5m2zXF4rLXd0vHClHbv4","slug":"/nyheter/","title":"Nyheter på bio - Se senaste filmerna på bio | Filmstaden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"ZetiJ80XpdiBWdDvn4gYr","variant":"none","urlName":"Företag","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2YKTwR8HDpTbiEYKLtDDGi","slug":"/foretag/","title":"Filmstaden för Företag - Upptäck våra företagserbjudanden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6CfqcYBhP8SWMvaJcbR0kB","variant":"none","urlName":"Kundservice","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2f4e0Q4VHsMh2NhtF6WPRY","slug":"/kundservice/fragor-och-svar/","title":"Frågor och svar"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null}],"linkListsLoggedIn":[{"__typename":"ContentfulShortcutsBlock","contentful_id":"uTqoqrNeNZlwh8ByFTUIY","shortcutsHeading":"Gå på bio","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"4aTc4WcIn9qyddB2ozl7el","variant":"none","urlName":"På bio nu","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2WkO4DqHw0pdQbatRynwAb","slug":"/pa-bio-nu/","title":"På bio nu - Upptäck vilka nya biofilmer som går på Filmstaden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"40KpCBRbCCx4h5dDqZnXrd","variant":"none","urlName":"Kommande filmer","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"5kS7C3EaBvtYdbeIx2zhoJ","slug":"/kommande-filmer/","title":"Kommande filmer på bio - Filmer som kommer"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"49CnBEmZclNXlI8drr2Nvq","variant":"none","urlName":"Barn och familj","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3BsCq1cQPeg8uwfTDK65g","slug":"/familj/","title":"Familjebio hos Filmstaden - Upptäck film med hela familjen"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"4I8bLd9uwYXJvO0xfmAr98","variant":"none","urlName":"Bioupplevelsen","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2snd8izeRyOrOErjWz7c4k","slug":"/bioupplevelsen/","title":"Bioupplevelsen"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null},{"__typename":"ContentfulShortcutsBlock","contentful_id":"7t1RVNqdrapej7rxyvqei","shortcutsHeading":"Medlem","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"4zk8ohFtHCFB8vUGtyAfbX","variant":"none","urlName":"Mina sidor","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3X8WsrwhzcRo9mLgeyxN4c","slug":"/mina-sidor/","title":"Min profil"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"7GVPqZ7f52jJ761nguVpvE","variant":"none","urlName":"Medlemsskapet","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"23fRSqDRGXFpv1xDS1ZbAF","slug":"/medlem/","title":"Filmstadens medlemskap - Tjäna poäng på ditt biobesök"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null},{"__typename":"ContentfulShortcutsBlock","contentful_id":"2mSoVQKtRL70eEUcTOVdLM","shortcutsHeading":"Mer","shortcutLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"3ciylhvq6BvKfDLYsWz2dp","variant":"none","urlName":"Erbjudanden","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"1F1dtOKwZgYWbvpuqueuvR","slug":"/erbjudanden/","title":"Erbjudanden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"21se9E2J7dRgQcU5ZDmWDb","variant":"none","urlName":"Presentkort","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"6mfFBYLRiPAlUdZzWhm33Z","slug":"/presentkort/","title":"Presentkort"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"5mr33RremcjRx8bja4p9ZT","variant":"none","urlName":"Mat och dryck","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"54cTCbayr7EmJHAk54xJYo","slug":"/mat-och-dryck/","title":"Mat och dryck"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"1a9LN9UmeScrmbXMVHiJyh","variant":"none","urlName":"Nyheter","internalUrl":[{"__typename":"ContentfulNewsArticlesPage","contentful_id":"4c5m2zXF4rLXd0vHClHbv4","slug":"/nyheter/","title":"Nyheter på bio - Se senaste filmerna på bio | Filmstaden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"ZetiJ80XpdiBWdDvn4gYr","variant":"none","urlName":"Företag","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2YKTwR8HDpTbiEYKLtDDGi","slug":"/foretag/","title":"Filmstaden för Företag - Upptäck våra företagserbjudanden"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6CfqcYBhP8SWMvaJcbR0kB","variant":"none","urlName":"Kundservice","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2f4e0Q4VHsMh2NhtF6WPRY","slug":"/kundservice/fragor-och-svar/","title":"Frågor och svar"}],"externalUrl":null,"image":null,"target":null}],"cityFilter":null}],"mobileLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"7IIFHaGsyBrhlK6BFNqE7h","variant":"none","urlName":"Kommande","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"5kS7C3EaBvtYdbeIx2zhoJ","slug":"/kommande-filmer/","title":"Kommande filmer på bio - Filmer som kommer"}],"externalUrl":null,"image":{"__typename":"ContentfulAsset","contentful_id":"1Zu8HrbOWivqGkgRto3CRf","description":"biljetter","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/1Zu8HrbOWivqGkgRto3CRf/e7fb44ab17682c4606622d8f5dff549c/biljetter.svg","details":{"image":{"height":25,"width":25}}}},"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6FPnAsjcUC3jR2gui1PbCE","variant":"none","urlName":"Logga in","internalUrl":null,"externalUrl":"https://services.cinema-api.com/redirect/externalSignUpOrIn/se?redirectUrl=https://www.filmstaden.se/mina-sidor/","image":{"__typename":"ContentfulAsset","contentful_id":"5UkQAqjo0K2OnCBcxN456D","description":"Medlem","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/5UkQAqjo0K2OnCBcxN456D/c6c82d95599627818f45a80b1e7192bb/medlem.svg","details":{"image":{"height":25,"width":25}}}},"target":null}],"mobileLinkListLoggedIn":[{"__typename":"ContentfulWebPageUrl","contentful_id":"7IIFHaGsyBrhlK6BFNqE7h","variant":"none","urlName":"Kommande","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"5kS7C3EaBvtYdbeIx2zhoJ","slug":"/kommande-filmer/","title":"Kommande filmer på bio - Filmer som kommer"}],"externalUrl":null,"image":{"__typename":"ContentfulAsset","contentful_id":"1Zu8HrbOWivqGkgRto3CRf","description":"biljetter","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/1Zu8HrbOWivqGkgRto3CRf/e7fb44ab17682c4606622d8f5dff549c/biljetter.svg","details":{"image":{"height":25,"width":25}}}},"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"2niHXK47IlSBqOMIFpVlgO","variant":"none","urlName":"Mina sidor","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3X8WsrwhzcRo9mLgeyxN4c","slug":"/mina-sidor/","title":"Min profil"}],"externalUrl":null,"image":{"__typename":"ContentfulAsset","contentful_id":"5UkQAqjo0K2OnCBcxN456D","description":"Medlem","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/5UkQAqjo0K2OnCBcxN456D/c6c82d95599627818f45a80b1e7192bb/medlem.svg","details":{"image":{"height":25,"width":25}}}},"target":null}],"mobileMenuButton":{"__typename":"ContentfulWebPageUrl","contentful_id":"4QpqprhCoxJ9OpNrOX3aX4","variant":"none","urlName":"Meny","internalUrl":null,"externalUrl":null,"image":{"__typename":"ContentfulAsset","contentful_id":"1jRvjX3t7O47huWDwOSKeH","description":"meny","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/1jRvjX3t7O47huWDwOSKeH/fb537d64a8302c83bea5b023d083b717/menu.svg","details":{"image":{"height":24,"width":24}}}},"target":null},"addCinemaPageToLinkListsIndex":"1","addCinemaPageToLinkListsLoggedInIndex":"1"},"footer":{"__typename":"ContentfulMainFooter","contentful_id":"3rreTSpyJzH5niWZBoIYlz","firstSectionHeading":"Om oss","firstSectionLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"4qM116LQh0596b06xx8Cw7","variant":"none","urlName":"Jobba hos oss","internalUrl":null,"externalUrl":"https://jobb.filmstaden.se/","image":null,"target":"_blank"},{"__typename":"ContentfulWebPageUrl","contentful_id":"6vQACR9mHecHcdXUHGUXBt","variant":"none","urlName":"Press","internalUrl":null,"externalUrl":"https://www.mynewsdesk.com/se/filmstaden-ab/","image":null,"target":"_blank"},{"__typename":"ContentfulWebPageUrl","contentful_id":"74SnO3CJ1jC5ANMYn2MrLt","variant":"none","urlName":"Om Filmstaden","internalUrl":[{"__typename":"ContentfulCustomerServiceCategoryPage","contentful_id":"2VM7iPOHlGkRdpqboi1fYP","heading":"Om Filmstaden","title":"Om Filmstaden","slug":"/fragor-och-svar/om-filmstaden/","parentPage":{"slug":"/kundservice/fragor-och-svar/"}}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"3D0rIYXE8oYHBnNXi02DIf","variant":"none","urlName":"Filmpanelen","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"4IKM137s5iBcIcKsgHEUCv","slug":"/filmpanelen/","title":"Bli en del av Filmpanelen – Gå med och gör din röst hörd"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"33lbp8AtqW3kKIgvziF5Vp","variant":"none","urlName":"Alla våra biostäder","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"HB7FHKkiksuJRqr18I8ji","slug":"/alla-biostader/","title":"Filmstadens biostäder - Hitta biostaden för ditt nästa biobesök"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6Y2y14lb5aargv3BndCxRo","variant":"none","urlName":"Alla våra biografer","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3pfflcsvfFQe49VFQUszvG","slug":"/biografer/","title":"Filmstadens biografer - Hitta biografen för ditt nästa biobesök"}],"externalUrl":null,"image":null,"target":null}],"secondSectionHeading":"För företag","secondSectionLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"6E6so8MYkxt98bDJBFLTa3","variant":"none","urlName":"Företagsbiljetter","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"7oz5C9Pcyuilu7MSOfcKb3","slug":"/foretagsbiljetter/","title":"Filmstadens företagsbiljetter - Biobiljetter för företag"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"1fFYfm7LqYDMF0113CLWvI","variant":"none","urlName":"Möten & Event","internalUrl":null,"externalUrl":"https://moten.filmstaden.se/","image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"4bRDAjniSWM8v5b9cC2Qwq","variant":"none","urlName":"Bioreklam","internalUrl":null,"externalUrl":"https://media.filmstaden.se/","image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"2st4c0H24hEUSkAgufyEH9","variant":"none","urlName":"Föreningsbiljetten","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"3bllynP8LfB1KhFU4bF7Ip","slug":"/foreningsbiljetten/","title":"Tjäna pengar till föreningen med Filmstadens Föreningsbiljetter"}],"externalUrl":null,"image":null,"target":null}],"thirdSectionHeading":"Hjälp & kontakt","thirdSectionLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"4lk1pz8Zd6Xqss6s8doMKp","variant":"none","urlName":"Kundservice","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"2f4e0Q4VHsMh2NhtF6WPRY","slug":"/kundservice/fragor-och-svar/","title":"Frågor och svar"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"42QN9sOaJZBXyDLyME2pmH","variant":"none","urlName":"Tillgänglig bio","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"1jPrc0Y2UYEqllrfaNPJ9Q","slug":"/tillganglig-bio/","title":"Tillgänglig bio"}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"etoAzCKBR5AJQvWuE7fhY","variant":"none","urlName":"Autismvänlig bio","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"76vpMbo1dUaVvgt6LYsEXi","slug":"/tillganglig-bio/autismvanlig-bio/","title":"Autismvänlig bio"}],"externalUrl":null,"image":null,"target":"_blank"},{"__typename":"ContentfulWebPageUrl","contentful_id":"4KbbY5FiFEHD9HoDZbMdRK","variant":"none","urlName":"Personuppgiftspolicy","internalUrl":[{"__typename":"ContentfulCustomerServiceQaPage","contentful_id":"12ZO53mFNjYfF1XUiaHKdg","slug":"/personuppgiftspolicy/","title":"Personuppgiftspolicy","parentPage":{"slug":"/villkor-och-policies/","parentPage":{"slug":"/kundservice/fragor-och-svar/"}}}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6xmj9m22DPEniuE9Ext6oF","variant":"none","urlName":"Cookiepolicy","internalUrl":[{"__typename":"ContentfulCustomerServiceQaPage","contentful_id":"70vpsuJOZHyByldADIjt9M","slug":"/cookiepolicy/","title":"Cookiepolicy","parentPage":{"slug":"/villkor-och-policies/","parentPage":{"slug":"/kundservice/fragor-och-svar/"}}}],"externalUrl":null,"image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"6tLP6ViTJHgt0DI0RWh4Xf","variant":"none","urlName":"Kontakta oss","internalUrl":[{"__typename":"ContentfulContentPage","contentful_id":"zLABfbs6IZRIAlZgvD7za","slug":"/kundservice/kontakta-oss/","title":"Kontakta oss - Filmstaden Kundservice"}],"externalUrl":null,"image":null,"target":null}],"fourthSectionHeading":"Sociala medier","fourthSectionLinkList":[{"__typename":"ContentfulWebPageUrl","contentful_id":"D9agsSwvzln9UuColxtWR","variant":"none","urlName":"TikTok","internalUrl":null,"externalUrl":"https://www.tiktok.com/@filmstaden","image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"3IIK3OZdNrd9kBy9dGwgGd","variant":"none","urlName":"Instagram","internalUrl":null,"externalUrl":"https://www.instagram.com/filmstaden_ab/","image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"1WsQVHqku30CANTpXNQq9A","variant":"none","urlName":"Facebook","internalUrl":null,"externalUrl":"https://www.facebook.com/filmstadenab","image":null,"target":null},{"__typename":"ContentfulWebPageUrl","contentful_id":"72xpDPfLkNX2FgGiS4SkAF","variant":"none","urlName":"LinkedIn","internalUrl":null,"externalUrl":"https://se.linkedin.com/company/filmstaden","image":null,"target":null}],"logotype":{"__typename":"ContentfulAsset","contentful_id":"439umO6J0SsrYITVDi9PPo","description":"Filmstaden logotype","file":{"url":"//images.ctfassets.net/ha69n8ghbltw/439umO6J0SsrYITVDi9PPo/21bc1a576ec9ed2d9fc548a55b668dda/logo.svg","details":{"image":{"height":32,"width":146}}}},"trademarkText":"Filmstaden ©2024. En del av Odeon Cinemas Group"}}'
    )
  })

  return await page.content()
}

export default async (_req: Request) => {
  const logService = new LogService(
    new NetlifyStore('logs'),
    'scrape-filmstaden'
  )
  const movieService = new MovieService(new NetlifyStore('movies'))
  const showtimeService = new ShowtimeService(new NetlifyStore('showtimes'))
  const filmstadenService = new FilmstadenService(
    movieService,
    showtimeService,
    logService
  )

  try {
    const browser = await getBrowser()

    const page = await browser.newPage()

    await visitMainPage(page)

    await wait(1000)

    const [movies, movieLink] = await visitUpcomingMovies(page)

    if (!movies || !movieLink) {
      return new Response('FAIL!')
    }

    await wait(1000)

    const showings = await visitMovieLink(page, movieLink)

    if (!showings) {
      return new Response('FAIL!')
    }

    await page.close()

    await browser.close()

    await filmstadenService.process(movies, showings)

    console.log('OK!')

    return new Response('OK!')
  } catch (err) {
    console.error(err)
    logService.create({
      date: new Date(),
      level: 'ERROR',
      message: err?.message ?? 'Unknown error'
    })
    return new Response(err?.message ?? err)
  }
}

export const config: Config = {
  schedule: '@daily'
}
