# Heartbeat Ministries — Website

Single-page static site. Ready to deploy on Netlify (or any static host).

## Deploy
1. Drag this entire folder onto Netlify's deploy drop zone
2. Connect your custom domain in Site Settings → Domain Management

## File Structure
- `index.html` — The entire site (HTML + CSS + JS in one file)

## To Edit
Everything is in `index.html`:
- **Scripture verses** — Search for `const verses = [` (around line 530)
- **Inspiration cards** — Search for `const inspirations = [`
- **Blog previews** — Search for `const blogPosts = [`
- **Colors** — CSS variables at the top in `:root { ... }`
- **Hero text** — Search for `Hope you` in the HTML
- **About / Mission** — Search for `Our Mission`
- **Prayer form** — Search for `Submit a Request`

## Future Enhancements
- Connect prayer form to a real backend (Supabase, email, etc.)
- Add a CMS for blog posts
- Add donation/giving integration
- Add service times and contact info
