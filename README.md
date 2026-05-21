<div align="center">

# 📋 BoardFlow

**A premium, native-feeling, cross-platform task management application.**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/Zustand-5-764ABC?logo=react&logoColor=white)](#)

</div>

<br />

BoardFlow is designed to provide a frictionless user experience across all your devices, combining the performance of a native app with the flexibility of modern web technologies. 

---

## ✨ Key Features

- 🌍 **Cross-Platform**: A single unified codebase that runs seamlessly on desktop (**Windows, Linux, macOS**) and mobile (**Android, iOS**).
- 🎨 **Adaptive UI**: Responsive layouts tailored for both desktop environments (sleek sidebar navigation) and mobile environments (native-feeling bottom navigation bar).
- 💾 **Offline-First Storage**: Persistent, highly efficient state management using the Tauri local store adapter (`boardflow.dat`). Your data is kept secure on the native file system, not in a volatile browser cache.
- 🧠 **Natural Language Input**: Integrated NLP support allowing you to create tasks effortlessly using conversational language (e.g., *"Meeting with team tomorrow at 5pm"*).
- ⏪ **Forgiving User Experience**: Built-in Undo/Redo architecture featuring a non-intrusive `UndoSnackbar` to prevent friction from destructive actions.
- 🌓 **Dynamic Theming**: Native support for dark and light modes, respecting your system preferences out of the box.
- 📊 **Rich Views**: Integrated Calendar and Statistics views to help you visualize your productivity over time.
- 🔔 **Native Notifications**: Seamless integration with your OS's native notification system for task reminders.

---

## 🛠️ Tech Stack & Architecture

BoardFlow is built on the bleeding edge of web and systems programming:

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Tauri v2](https://v2.tauri.app/) | Replaces Electron. Uses native OS webviews for minimal memory footprint and blistering startup times. |
| **Frontend** | [React 19](https://react.dev/) | The latest concurrent React features for buttery-smooth rendering. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type-safety across the entire frontend. |
| **Build Tool** | [Vite](https://vitejs.dev/) | Lightning-fast HMR and optimized production builds. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS for rapid, responsive UI development. |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Minimalist, unopinionated state management tailored for our offline-first storage adapter. |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful, consistent iconography. |

---

## 🚀 Development Setup

### Prerequisites

Ensure you have the following installed to develop and build the application:
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- **For Windows**: Visual Studio C++ Build Tools
- **For Android**: Android Studio & Android SDK
- **For iOS/macOS**: macOS with Xcode

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   *(This launches both the Vite dev server and the native Tauri window)*
   ```bash
   npm run tauri dev
   ```
   *(Alternatively, to run the web frontend in your browser only)*:
   ```bash
   npm run dev
   ```

### Building for Production

To build the application for your current host platform:
```bash
npm run tauri build
```
This compiles the Rust backend and generates native installers/bundles (e.g., `.msi` / `.exe` for Windows). 
> **Note:** To build for mobile targets, you would use `npm run tauri android build` or `npm run tauri ios build`.

---

## 📁 Project Structure

```text
📦 BoardFlow
 ┣ 📂 src               # Frontend React application
 ┃ ┣ 📂 components      # Reusable UI components (Layout, TaskEditor, etc.)
 ┃ ┣ 📂 pages           # Main application views (Home, Calendar, Stats, Options)
 ┃ ┣ 📂 store           # Zustand state management and Tauri storage adapters
 ┃ ┗ 📂 utils           # Helper functions, NLP logic, Audio/Notifications
 ┣ 📂 src-tauri         # Tauri Rust backend, configurations, and build settings
 ┗ 📂 dev               # Development resources and analysis reports
```

---

<div align="center">
  <i>Built with ❤️ using Tauri and React.</i>
</div>
