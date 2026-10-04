# Add GoStation social media links

## What will change
- Save the six supplied profile URLs in the existing site settings.
- Keep the links editable from the Admin Settings page.
- Verify each footer icon opens its matching profile in a new tab.

## Profiles
- X: `https://x.com/GoStationSA`
- Instagram: `https://www.instagram.com/gostationsa`
- LinkedIn: `https://www.linkedin.com/company/gostationsa`
- YouTube: `https://www.youtube.com/@gostationsa`
- TikTok: `https://www.tiktok.com/@gotationsa`
- Facebook: `https://www.facebook.com/gotationsa`

## Technical details
- Add a database migration that updates the existing `social_links` setting without changing the footer structure.
- Apply the same migration to the live Lovable Cloud database and check the public footer output.
