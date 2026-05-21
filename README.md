<div align="center">

# 📋 BoardFlow

**A hybrid native task management app built with React + Tauri.**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/Zustand-5-764ABC?logo=react&logoColor=white)](#)

</div>

<br />

BoardFlow is a React web frontend packaged with Tauri to run as a native desktop/mobile application. It is not a browser-only PWA; the app is distributed through the Tauri shell with native installers and mobile bundles.

---

## ✨ What this app is

- ✅ A **hybrid native application** using a web UI with a native shell
- ✅ Built for **desktop platforms** via Tauri (Windows, Linux, macOS)
- ✅ Supports **mobile packaging** through the Tauri Android/iOS toolchain
- ✅ Uses **local native storage** rather than relying on browser storage
- ✅ Not a pure PWA or browser-only app

---

## ✨ Key Features

- 🌍 **Hybrid Native App**: Single codebase with native desktop/mobile Tauri packaging.
- 🎨 **Responsive UI**: Desktop sidebar navigation switches to mobile bottom navigation on smaller screens.
- 💾 **Native storage**: Uses Tauri store for reliable local persistence.
- 🧠 **NLP-friendly task entry**: Supports natural-language style task creation.
- ⏪ **Undo/Redo support**: Includes undo/redo flows with a subtle snackbar.
- 🌓 **Theme-aware UI**: Dark/light theming with smooth transitions.
- 📊 **Calendar + Stats**: Built-in calendar and productivity statistics views.
- 🔔 **Native notifications**: Uses OS notification capabilities through Tauri plugins.

---

## 🛠️ Tech Stack

| Category | Technology | Notes |
| :--- | :--- | :--- |
| App Shell | Tauri v2 | Native wrapper for web UI and cross-platform distribution |
| Frontend | React 19 | Modern React UI and routing |
| Language | TypeScript | Strong typing for frontend logic |
| Bundler | Vite | Fast development and production builds |
| Styling | Tailwind CSS v4 | Utility CSS with rapid responsive styling |
| State | Zustand | Lightweight global state and persistence |
| Icons | Lucide React | Simple, consistent icon library |

---

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- Rust (stable)
- Windows: Visual Studio C++ Build Tools
- Android: Android Studio + SDK
- iOS/macOS: Xcode

### Install

```bash
npm install
```

### Run locally

```bash
npm run tauri dev
```

This launches the Tauri app with the Vite frontend.

To run the web frontend only:

```bash
npm run dev
```

### Build

```bash
npm run tauri build
```

This creates native desktop bundles. Mobile builds are available via Tauri mobile targets.

---

## 📁 Project Structure

```text
📦 BoardFlow
 ┣ 📂 src               # React frontend
 ┃ ┣ 📂 components      # Shared UI components
 ┃ ┣ 📂 pages           # App screens (Tasks, Calendar, Stats, Options)
 ┃ ┣ 📂 store           # Zustand state + Tauri storage logic
 ┃ ┗ 📂 utils           # Helpers, NLP, notifications, audio
 ┣ 📂 src-tauri         # Tauri backend and build configuration
 ┗ 📂 dev               # Development notes and analysis files
```

---

<div align="center">
  <i>Built with ❤️ by Omar Khaled Elkhouly.</i>
</div>

<div align="center" class="mt-4 text-sm text-[#6b7280]">
  © 2026 Omar Khaled Elkhouly — created by Omar-Khaled-57 on GitHub.
</div>
