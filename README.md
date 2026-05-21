<div align="center">

<img src="src/assets/icon.png" alt="SetupHub app icon" width="128" />

# SetupHub

<p>
	<a href="https://github.com/belinda-hagen/SetupHub">
		<img src="https://img.shields.io/badge/Catalog-Popular%20Apps-2f81f7?style=for-the-badge&labelColor=1f2328&logo=electron&logoColor=white" alt="Popular apps catalog" />
	</a>
	<a href="https://github.com/belinda-hagen/SetupHub/releases">
		<img src="https://img.shields.io/github/downloads/belinda-hagen/SetupHub/total?style=for-the-badge&labelColor=1f2328&color=2f81f7&logo=github&logoColor=white&label=Downloads" alt="Total downloads from GitHub releases" />
	</a>
</p>

<p>
	<img src="https://img.shields.io/badge/Electron-41.x-47848f?style=for-the-badge&labelColor=1f2328&logo=electron&logoColor=white" alt="Electron 41" />
	<img src="https://img.shields.io/badge/Platform-Windows-0078d6?style=for-the-badge&labelColor=1f2328&logo=windows11&logoColor=white" alt="Windows portable" />
	<img src="https://img.shields.io/badge/Built%20with-Node.js-3c873a?style=for-the-badge&labelColor=1f2328&logo=node.js&logoColor=white" alt="Node.js" />
	<img src="https://img.shields.io/badge/License-MIT-768390?style=for-the-badge&labelColor=1f2328&logo=open-source-initiative&logoColor=white" alt="License MIT" />
</p>

**Discover, collect, and install your favorite software — all from one place.**

A desktop app for browsing a curated catalog of popular software, copying install commands, and building a personal setup list for any new machine.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Categories](#categories)
- [Run locally](#run-locally)
- [Build](#build)
- [Project structure](#project-structure)
- [Requirements](#requirements)

---

## Overview

SetupHub is an Electron app that helps you browse a curated software catalog across common categories such as development, gaming, creative work, productivity, and utilities. It is designed to make new-machine setup faster by keeping software discovery, install commands, and quick website links in one place.

> **In short:** stop hunting through bookmarks and download pages — pick what you need, copy the command, and move on.

---

## Features

| | Feature | Description |
| :---: | :--- | :--- |
| **▣** | **Curated catalog** | Widely used apps grouped across multiple categories |
| **▣** | **Search & filters** | Category filters and live search for fast discovery |
| **▣** | **Cross-platform commands** | Install or copy commands for Windows, macOS, and Linux when available |
| **▣** | **Setup list** | Collect apps in a personal list before installing them in bulk |
| **▣** | **Quick links** | Jump straight to official product websites |
| **▣** | **In-app panels** | Recent installs and notifications surfaced inside the app |

---

## Categories

| Category | Focus |
| :--- | :--- |
| **Development** | Editors, runtimes, version control, and dev tooling |
| **Gaming** | Stores, launchers, and gaming utilities |
| **Creative** | Design, video, audio, and content creation apps |
| **Productivity** | Office suites, notes, communication, and workflow tools |
| **Utilities** | System helpers, compression, monitoring, and everyday extras |

---

## Run locally

Clone the repo and start the dev build:

```bash
npm install
npm start
```

---

## Build

Create the Windows installer (NSIS, one-click, per-user):

```bash
npm run build
```

Or generate an unpacked build output instead:

```bash
npm run build:dir
```

Builds land in the `dist/` directory. A full build produces:

- `SetupHub-Setup-<version>.exe` — the NSIS installer
- `latest.yml` — metadata read by the in-app updater
- `SetupHub-Setup-<version>.exe.blockmap` — delta-update support

---

## Project structure

```text
SetupHub/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Safe renderer bridge
│   ├── renderer.js      # Catalog UI and interactions
│   ├── styles.css       # Desktop UI styling
│   ├── data/
│   │   └── programs.js  # Seeded software catalog
│   └── assets/          # Icons and images
└── package.json
```

| File | Purpose |
| :--- | :--- |
| [`src/main.js`](src/main.js) | Electron main process |
| [`src/preload.js`](src/preload.js) | Safe renderer bridge |
| [`src/renderer.js`](src/renderer.js) | Catalog UI and interactions |
| [`src/data/programs.js`](src/data/programs.js) | Seeded software catalog |
| [`src/styles.css`](src/styles.css) | Desktop UI styling |

---

## Requirements

- **Node.js** — required to install dependencies and run Electron
- **npm** — used for all scripts in this repo
- **Windows** — the primary build target; the catalog can still surface macOS and Linux commands where available



