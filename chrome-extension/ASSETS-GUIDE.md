# Chrome Web Store Assets Guide

Visual assets required for Chrome Web Store submission.

---

## Required Assets Checklist

- [x] **Extension Icons** (auto-generated)
  - `icon16.png` — 16×16px
  - `icon48.png` — 48×48px  
  - `icon128.png` — 128×128px

- [ ] **Small Promo Tile** — 440×280px (REQUIRED)
- [ ] **Marquee Promo Tile** — 1400×560px (recommended)
- [ ] **Screenshots** — 1280×800 or 640×400px (1-5 images, REQUIRED)

---

## 1. Extension Icons ✅

**Status:** Already generated in `icons/` folder

**Verify:**
```powershell
cd c:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension\icons
dir *.png
```

Should show:
- icon16.png
- icon48.png
- icon128.png

**If missing:** Open `generate-icons.html` in browser, right-click each canvas, save as PNG.

---

## 2. Small Promo Tile (440×280px)

**Purpose:** Appears in Chrome Web Store search results

**Design specs:**
- Size: 440×280px
- Format: PNG or JPEG
- Max file size: 1MB
- Background: Kyriq brand colors (#10b981 → #059669 gradient)

**Content to include:**
- Kyriq logo
- Tagline: "AI-Powered Check Reconciliation"
- Key visual (check icon or dashboard preview)

**Design template:**
```
┌─────────────────────────────────────┐
│  [Kyriq Logo]                       │
│                                     │
│  AI-Powered Check Reconciliation    │
│  for QuickBooks Online              │
│                                     │
│  [Check Icon or UI Preview]         │
└─────────────────────────────────────┘
     440px × 280px
```

**Tools:**
- Canva (free templates)
- Figma (design from scratch)
- Photoshop/GIMP
- PowerPoint (export as PNG)

**Quick Canva method:**
1. Go to canva.com
2. Create custom size: 440×280px
3. Add gradient background (#10b981 to #059669)
4. Add text: "Kyriq" + tagline
5. Add icon or screenshot
6. Download as PNG

---

## 3. Marquee Promo Tile (1400×560px)

**Purpose:** Featured placement on Chrome Web Store (optional but recommended)

**Design specs:**
- Size: 1400×560px
- Format: PNG or JPEG
- Max file size: 2MB
- Background: Kyriq brand colors

**Content to include:**
- Kyriq logo (larger)
- Main headline: "Automate QuickBooks Check Reconciliation"
- 3-4 key features with icons
- UI screenshot or mockup

**Design template:**
```
┌───────────────────────────────────────────────────────────────┐
│  [Kyriq Logo]          Automate QuickBooks Check Reconciliation│
│                                                                 │
│  ✅ AI OCR Extraction    🎯 Smart Matching    ⚡ One-Click Approve│
│                                                                 │
│  [Extension UI Screenshot]                                      │
└───────────────────────────────────────────────────────────────┘
                    1400px × 560px
```

---

## 4. Screenshots (1280×800 or 640×400px)

**Purpose:** Show extension features in action

**Requirements:**
- Minimum: 1 screenshot
- Maximum: 5 screenshots
- Size: 1280×800px (recommended) or 640×400px
- Format: PNG or JPEG
- Max file size: 5MB each

**Recommended screenshots:**

### Screenshot 1: Extension Popup - Matches View
**What to show:**
- Extension popup open
- Matches list with data
- Match scores visible
- Status badges (Pending, Matched, etc.)

**How to capture:**
1. Load extension in Chrome
2. Click Kyriq icon
3. Ensure matches are loaded
4. Use Windows Snipping Tool (`Win + Shift + S`)
5. Capture popup window
6. Resize to 1280×800px

### Screenshot 2: Upload Interface
**What to show:**
- Upload tab active
- Drag-drop zone
- Extracted check data visible

### Screenshot 3: QuickBooks Overlay
**What to show:**
- QuickBooks Online page in background
- Kyriq overlay panel open
- Match summary visible

### Screenshot 4: Approve & Clear
**What to show:**
- Match details expanded
- "Approve & Clear" button highlighted
- Match score and confidence visible

### Screenshot 5: Settings Page
**What to show:**
- Settings/Options page
- Configuration fields
- Clean, professional layout

**Capture tips:**
- Use high-quality monitor (1920×1080 or higher)
- Ensure UI is fully loaded (no loading spinners)
- Use real data (not "Lorem ipsum")
- Hide sensitive information (blur API keys, emails)
- Consistent window size across all screenshots
- Good lighting/contrast

**Resize screenshots:**
```powershell
# Using ImageMagick (install first)
magick screenshot.png -resize 1280x800 screenshot-resized.png

# Or use online tool: https://www.iloveimg.com/resize-image
```

---

## 5. Privacy Policy Page

**Required:** Yes (extension handles user data)

**Options:**

### Option A: GitHub Pages (Free)
1. Create `privacy.html` in your repo
2. Enable GitHub Pages in repo settings
3. URL: `https://yourusername.github.io/cheque-extractor/privacy.html`

### Option B: Your Website
1. Create page at `https://yourcompany.com/privacy`
2. Ensure it's publicly accessible

### Option C: Google Docs
1. Create Google Doc with privacy policy
2. Share → Anyone with link can view
3. Use share link

**Template:** See `WEB-STORE-SUBMISSION.md` for privacy policy template

---

## 6. Support Email

**Required:** Yes

**Options:**
- Company email: `support@yourcompany.com`
- Gmail: `kyriq.support@gmail.com`
- Contact form: Link to your website contact page

**Best practice:** Use professional domain email

---

## Asset Creation Workflow

### Step 1: Gather Materials
- [ ] Kyriq logo (SVG or high-res PNG)
- [ ] Brand colors (#10b981, #059669)
- [ ] Extension screenshots
- [ ] Feature descriptions

### Step 2: Design Promo Tiles
- [ ] Create 440×280px small tile
- [ ] Create 1400×560px marquee tile
- [ ] Export as PNG

### Step 3: Capture Screenshots
- [ ] Screenshot 1: Matches view
- [ ] Screenshot 2: Upload interface
- [ ] Screenshot 3: QB overlay
- [ ] Screenshot 4: Approve action
- [ ] Screenshot 5: Settings
- [ ] Resize all to 1280×800px

### Step 4: Prepare Text
- [ ] Write store description (see `WEB-STORE-SUBMISSION.md`)
- [ ] Create privacy policy
- [ ] Set up support email

### Step 5: Organize Files
```
web-store-assets/
├── promo-tile-small.png (440×280)
├── promo-tile-marquee.png (1400×560)
├── screenshot-1-matches.png (1280×800)
├── screenshot-2-upload.png (1280×800)
├── screenshot-3-overlay.png (1280×800)
├── screenshot-4-approve.png (1280×800)
├── screenshot-5-settings.png (1280×800)
└── description.txt
```

---

## Design Resources

### Free Design Tools
- **Canva** — canva.com (templates, easy to use)
- **Figma** — figma.com (professional design)
- **GIMP** — gimp.org (Photoshop alternative)
- **Inkscape** — inkscape.org (vector graphics)

### Screenshot Tools
- **Windows Snipping Tool** — `Win + Shift + S`
- **ShareX** — getsharex.com (advanced)
- **Greenshot** — getgreenshot.org
- **Chrome DevTools** — `F12` → Device toolbar for consistent sizing

### Image Editing
- **Photopea** — photopea.com (online Photoshop)
- **Remove.bg** — remove.bg (background removal)
- **TinyPNG** — tinypng.com (compression)
- **ILoveIMG** — iloveimg.com (resize, crop, convert)

### Icon Resources
- **Lucide Icons** — lucide.dev (used in extension)
- **Heroicons** — heroicons.com
- **Feather Icons** — feathericons.com

---

## Brand Guidelines

### Colors
- **Primary Green:** `#10b981`
- **Dark Green:** `#059669`
- **Gradient:** `linear-gradient(135deg, #10b981 0%, #059669 100%)`
- **Text:** `#1f2937` (dark gray)
- **Background:** `#ffffff` (white)

### Typography
- **Headings:** System font stack (SF Pro, Segoe UI, Roboto)
- **Body:** Same as headings
- **Size:** 14-16px for body, 24-32px for headings

### Logo Usage
- Use high-contrast version on light backgrounds
- Maintain clear space around logo (minimum 20px)
- Don't distort or rotate logo
- Don't change logo colors

---

## Quality Checklist

Before submitting assets:

- [ ] All images are correct dimensions
- [ ] File sizes under limits (1-5MB)
- [ ] No pixelation or blur
- [ ] Text is readable
- [ ] Colors match brand guidelines
- [ ] No sensitive data visible (API keys, emails)
- [ ] Consistent styling across all assets
- [ ] Screenshots show real functionality
- [ ] Privacy policy is publicly accessible
- [ ] Support email is active

---

## Example Asset Set

Here's what a complete asset set looks like:

```
✅ icon16.png (16×16) — Already generated
✅ icon48.png (48×48) — Already generated
✅ icon128.png (128×128) — Already generated
📝 promo-small.png (440×280) — TO CREATE
📝 promo-marquee.png (1400×560) — TO CREATE
📝 screenshot-1.png (1280×800) — TO CREATE
📝 screenshot-2.png (1280×800) — TO CREATE
📝 screenshot-3.png (1280×800) — TO CREATE
📝 screenshot-4.png (1280×800) — TO CREATE
📝 screenshot-5.png (1280×800) — TO CREATE
📝 Privacy policy URL — TO CREATE
✅ Support email — Already have
```

---

## Time Estimate

| Task | Time |
|------|------|
| Design promo tiles | 1-2 hours |
| Capture screenshots | 30 minutes |
| Resize/edit images | 30 minutes |
| Write privacy policy | 30 minutes |
| **Total** | **2.5-3.5 hours** |

---

## Next Steps

1. ✅ Review this guide
2. 📝 Create promo tiles (Canva/Figma)
3. 📸 Capture screenshots (Windows Snipping Tool)
4. 📄 Write privacy policy (use template)
5. 📦 Organize all assets in folder
6. 🚀 Proceed to `WEB-STORE-SUBMISSION.md`

---

**Need help?** See full submission guide in `WEB-STORE-SUBMISSION.md`
