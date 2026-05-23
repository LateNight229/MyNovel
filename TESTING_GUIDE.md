# 🧪 Quick Testing Guide

## ⚡ 5-Minute Setup

### Step 1: Open Firefox Developer Mode
```
1. Click address bar
2. Type: about:debugging
3. Press Enter
```

### Step 2: Load the Extension
```
1. Click "This Firefox" (left sidebar)
2. Click "Load Temporary Add-on" button
3. Navigate to: d:\Source\Game\MyNovel.worktrees\agents-firefox-reader-mode-enhancements
4. Select: manifest.json
5. Click "Open" button
```

### Step 3: Test the Extension
✅ **Verify** - Look for blue book icon in toolbar (top right)

---

## 🧪 Testing Scenarios

### Test 1: Auto-Detect Content
1. Go to: https://www.wattpad.com/stories/any-story (pick any story)
2. Find a chapter to read
3. Click the blue extension icon
4. Click "🎯 Enable Reader Mode"
5. **Expected**: Page should show clean text with no ads/sidebars
6. **Check**: Title should appear in top bar

### Test 2: Font Customization
1. While in reader mode, click ⚙️ Settings
2. Adjust Font Size slider to 24px
3. Select "Merriweather" from Font Family
4. Adjust Line Height to 2.0
5. Change Text Color to yellow, Background to dark blue
6. Click "Save"
7. **Expected**: Text immediately updates with new settings

### Test 3: Save Chapter
1. In reader mode, click 💾 Save button
2. Confirm the dialog
3. **Expected**: Toast/alert shows "Chapter saved!"
4. **Check**: Look for success message in console (F12)

### Test 4: Library View
1. Click extension icon again
2. Click "📖 View Library"
3. New tab opens
4. **Expected**: Shows saved series with chapter count, word count
5. **Check**: If no saves yet, see "No saved series" message

### Test 5: Settings Page
1. Click extension icon
2. Click ⚙️ Advanced Settings (at bottom of popup)
3. New tab opens with Settings page
4. **Expected**: All font options visible
5. Change auto-enable checkbox and save
6. **Check**: Next time you reload, reader mode might auto-enable

### Test 6: Responsive Design
1. Press F12 (Developer Tools)
2. Click device icon (Responsive Design Mode)
3. Select "iPhone 12"
4. Enable reader mode on a novel
5. **Expected**: Layout adapts, buttons still accessible
6. **Check**: No overflow, readable on mobile

---

## 🔍 Things to Verify

### Content Detection Works
- [ ] Main article content is extracted
- [ ] Sidebars/navigation removed
- [ ] Ads completely gone (or most of them)
- [ ] Title shows in control bar

### UI is Clean
- [ ] No overlapping elements
- [ ] Controls bar is sticky (stays at top when scrolling)
- [ ] Close (✕) button works
- [ ] Settings button responsive

### Storage Works
- [ ] Save button functions
- [ ] Library view shows saved chapters
- [ ] Statistics (chapter count, words) correct
- [ ] Can export to EPUB

### Settings Persist
- [ ] Change font size
- [ ] Reload page
- [ ] **Expected**: Font size stays same

---

## 🐛 Troubleshooting

### Extension icon not showing
→ Check toolbar (top right of Firefox)
→ May need to click "Extensions" menu icon first

### "Could not detect content" error
→ Might be a site we don't support yet
→ Add host permission to manifest.json for that domain

### Page looks broken after enabling reader mode
→ That's a feature - it's REPLACING the whole page with clean reader
→ Click ✕ to go back to normal view

### Settings not saving
→ Check F12 console for errors
→ Might be IndexedDB not working (unlikely in Firefox)

### Export button greyed out / doesn't work
→ Need to save at least one chapter first
→ Check Library view to see saved chapters

---

## 📊 What You'll See

### Reader Mode Activated
```
╔═══════════════════════════════════════════════════════════════════╗
║ 📖 Chapter 1: The Beginning      ⚙️ Settings | 💾 Save | ✕ Close    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   The morning sun cast long shadows across the small village...  ║
║                                                                   ║
║   Sarah walked slowly through the empty streets, her mind        ║
║   occupied with thoughts of what was to come. She had spent      ║
║   years preparing for this moment, and now it was finally here.  ║
║                                                                   ║
║   [Clean, distraction-free reading experience]                   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Popup View
```
╔════════════════════════════════════════════╗
║  📚 Novel Reader Mode                      ║
║  Distraction-free reading for novel sites  ║
├────────────────────────────────────────────┤
║                                            ║
║  🎯 Enable Reader Mode          Inactive  ║
║                                            ║
║  Font Size: [====●===] 18px                ║
║  Theme: [Dark ▼]                           ║
║                                            ║
║  [💾 Save] [📖 View Library] [📥 Export]  ║
║                                            ║
║  Series:     0   Chapters:  0  Words: 0    ║
║                                            ║
║  [⚙️ Advanced Settings]                    ║
│                                            │
│  v1.0.0 • Report Issue                    │
└────────────────────────────────────────────┘
```

---

## 📝 Test Checklist

**Before Testing**
- [ ] Firefox is open
- [ ] Downloaded/cloned this repository
- [ ] Know the path to manifest.json

**During Testing**
- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Can navigate to a novel site
- [ ] Reader mode toggles on/off
- [ ] Settings apply immediately
- [ ] Save functionality works
- [ ] Library displays correctly

**After Testing**
- [ ] Note any bugs in an issue
- [ ] Test on 2-3 different novel sites
- [ ] Try export to EPUB
- [ ] Verify responsive design

---

## 🎯 Success Indicators

✅ **Reader mode activates** → Text is clean and readable  
✅ **Settings change text** → Font size/color updates instantly  
✅ **Save works** → Chapter appears in library  
✅ **No console errors** → F12 shows no red errors  
✅ **Mobile friendly** → Looks good on iPhone size  
✅ **Export works** → Can download EPUB file  

---

## 🚀 Next: If Testing Successful

1. **Report Success**: Everything works? Great!
2. **Report Issues**: Found bugs? Document them
3. **Suggest Features**: Ideas for improvement?
4. **Share Feedback**: Any UX improvements?

---

**Ready to test? Follow the 5-Minute Setup above!**
