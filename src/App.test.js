const puppeteer = require('puppeteer');

const isDebugging = () => {
	return process.env.DEBUG === 'true' ? {
		headless: false,
		slowMo: 250,
		devtools: true
	} : {};
}

let browser
let page
beforeAll(async() => {
	browser = await puppeteer.launch(isDebugging())
	page = await browser.newPage()
	await page.goto('http://med3web.s3-website.eu-central-1.amazonaws.com/')
	await page.setViewport({ width: 1280, height: 1024 })
})

describe('on page load', () => {
	test('loads correct title', async() => {
		const pageTitle = await page.title();

		expect(pageTitle).toBe('Med3Web DICOM 2D/3D browser')
	}, 10000)
})

