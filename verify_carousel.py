from playwright.sync_api import sync_playwright
import time

def verify_carousel():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # Go to the German home page (on port 3001)
        print("Navigating to home page (port 3001)...")
        page.goto("http://localhost:3001/de")

        # Wait for loading screen to disappear (wait for 4 seconds)
        print("Waiting for loading screen to disappear...")
        page.wait_for_timeout(4000)

        # Try finding by role 'region'
        print("Trying to find region with name 'Kundenbewertungen'...")
        carousel = page.get_by_role("region", name="Kundenbewertungen")

        if carousel.count() > 0:
            print("Found carousel!")

            # Scroll to it
            carousel.scroll_into_view_if_needed()

            # Wait for animation/scroll
            print("Waiting for animation...")
            page.wait_for_timeout(2000)

            # Get bounding box
            box = carousel.bounding_box()
            print(f"Carousel bounding box: {box}")

            if box:
                # Take screenshot of the carousel element only
                print("Taking element screenshot...")
                carousel.screenshot(path="verification_carousel_element.png")

                # Also take full page screenshot to see context
                print("Taking viewport screenshot...")
                page.screenshot(path="verification_carousel_viewport.png")
            else:
                print("Carousel has no bounding box (hidden?)")

        else:
            print("Carousel NOT found by role region.")

        browser.close()

if __name__ == "__main__":
    verify_carousel()
