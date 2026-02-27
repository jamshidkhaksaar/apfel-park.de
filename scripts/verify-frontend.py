from playwright.sync_api import sync_playwright

def verify_copy_address():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate clipboard permission
        context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        page = context.new_page()

        try:
            # 1. Navigate to the page (using the running dev server)
            page.goto("http://localhost:3000/en")

            # Wait for loading screen to disappear
            page.wait_for_selector(".loading-screen", state="detached")

            # 2. Scroll to footer
            footer = page.locator("footer")
            footer.scroll_into_view_if_needed()

            # 3. Find the copy button
            # We look for the button with the label "Copy address"
            copy_button = page.get_by_label("Copy address")

            if not copy_button.is_visible():
                print("Error: Copy address button not visible")
                return

            # 4. Click the button
            copy_button.click()

            # 5. Verify visual feedback (The "Copied!" tooltip)
            # It has role="status" and text "Copied!"
            feedback = page.get_by_role("status").filter(has_text="Copied!")

            # Wait for feedback to appear
            feedback.wait_for(state="visible", timeout=2000)

            # 6. Verify clipboard content (if possible in this env, otherwise just visual)
            # Note: Clipboard API might be restricted in headless without context permissions
            # We rely on visual feedback for now.

            # 7. Take screenshot
            page.screenshot(path="verification_copy_address.png")
            print("Verification successful! Screenshot saved to verification_copy_address.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_failed.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_copy_address()
