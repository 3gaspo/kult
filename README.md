# Kult — Personal Cultural Backlog Manager

**Kult** is a sleek, personal media and content database app designed to organize your cultural backlog (books, movies, TV series, video games, articles, podcasts, and custom media) and smart-recommend what to consume next using a customizable prioritization algorithm.

---

## 🌟 Key Features

### 🎯 Smart Priority Engine ("Effective Priority")
Instead of a static to-read/to-watch list, Kult dynamically computes an **Effective Priority** score for every item in your queue using a balanced formula that evaluates:
- **Priority (1-5):** How important or urgent this item is to you.
- **Expected Pleasure (1-5):** How much you expect to enjoy it.
- **Length / Shortness (1-5):** Quick wins vs. long epic commitments.
- **Freshness:** Boosts recently added items so new discoveries don't get buried immediately.
- **Backlog Aging:** Prevents older items from sitting forgotten indefinitely.

> You can fine-tune all formula weights directly in **Settings** to match your personal decision style!

---

### 📚 Comprehensive Content Tracking
- **Multiple Media Types:** Out-of-the-box support for Books, Movies, Series, and custom types.
- **Status Workflows:** Categorize items into:
  - ⏳ **To Complete** (Your backlog queue)
  - 📖 **Ongoing** (Currently reading, watching, or playing)
  - ✅ **Completed** (Finished items with completion dates)
- **Detailed Metadata:** Record authors/creators, publication years, priority levels, estimated length, custom tags/keywords, and personal notes.
- **Smart Sorting & Filtering:** Instantly filter by status, media type, tag, or search term, and sort by Effective Priority, Rating, Title, or Date Added.

---

### ⚙️ Customizable Media Types & Algorithm
- **Custom Content Types:** Create, rename, and reorder content types (e.g., Video Games, Podcasts, Comics, Research Papers).
- **Custom Weight Sliders:** Tailor the priority algorithm by adjusting weights for Priority, Pleasure, Shortness, Freshness, and Backlog Aging.

---

### 💾 Data Ownership, Import & Export
- **Cloud & Offline Sync:** Cloud synchronization with Firebase Firestore and Authentication, with local storage support.
- **JSON & CSV Backup:** Export your entire collection to JSON or CSV at any time, or restore from a backup file.

---

### 📱 Progressive Web App (PWA) & Mobile Friendly
- **Mobile First Design:** Fully responsive dark/light interface optimized for smartphones, tablets, and desktops.
- **Home Screen Installation:** Web App Manifest and Apple Touch Icon support for adding Kult to iOS and Android home screens as a standalone application.

---

### 🎨 Theme & Customization
- **Dark & Light Mode:** Automatic or manual toggle between dark and light color schemes.
- **Dev Mode Quick Access:** Seamless developer login helpers for rapid testing and dev environments.
- **Community Support & Credits:** Direct link to creator support ([Ko-fi](https://ko-fi.com/3gaspo)) and version tracking.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Motion (`motion/react`)
- **Backend & Database:** Firebase Auth & Cloud Firestore
- **State & Storage:** LocalStorage / Firestore sync

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run dev server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

---

*Created by Gaspard Berthelier — [Support on Ko-fi](https://ko-fi.com/3gaspo)*
