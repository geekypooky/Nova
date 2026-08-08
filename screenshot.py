import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:5173")
        
        # Wait a bit for the frontend to render and fetch initial states
        await page.wait_for_timeout(3000)
        
        # Take a screenshot
        await page.screenshot(path=r"C:\Users\pooji\.gemini\antigravity\brain\59639ec5-8521-4fe3-bd63-b1a091bd6577\frontend_preview.png")
        print("Screenshot saved successfully.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
