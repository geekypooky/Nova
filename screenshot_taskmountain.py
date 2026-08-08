import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:5173")
        
        print("Waiting for page load...")
        await page.wait_for_timeout(2000)
        
        print("Typing exec dysfunction message...")
        await page.fill("input[placeholder='Type to Nova...']", "I have so much work to do but I can't start.")
        await page.keyboard.press("Enter")
        
        print("Waiting for backend and 3D simulation to load...")
        await page.wait_for_timeout(5000)
        
        # Take screenshot of chaotic state (Mountain of Tasks)
        chaos_path = r"C:\Users\pooji\.gemini\antigravity\brain\59639ec5-8521-4fe3-bd63-b1a091bd6577\taskmountain_chaos.png"
        await page.screenshot(path=chaos_path)
        print("Captured chaos state")
        
        # Click "Drop a Task" to advance to the calm state
        for i in range(4):
            await page.click("button:has-text('Drop a Task')")
            await page.wait_for_timeout(500)
            
        print("Waiting for calm transition...")
        await page.wait_for_timeout(3000)
        
        # Take screenshot of calm state
        calm_path = r"C:\Users\pooji\.gemini\antigravity\brain\59639ec5-8521-4fe3-bd63-b1a091bd6577\taskmountain_calm.png"
        await page.screenshot(path=calm_path)
        print("Captured calm state")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
