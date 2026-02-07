# GitHub Discussions Enhancements

Chrome extension that provides advanced controls for managing GitHub Pull Request discussions.

## Features

- **Auto-expand discussions** – Automatically clicks "Load more..." buttons to reveal all PR comments
- **Resolve all discussions** – One-click resolution of all unresolved discussions
- **Hide resolved threads** – Automatically hide resolved discussions and regular comments
- **Control panel** – Easy-to-use UI panel in the lower right corner for managing all features

## Installation

1. Navigate to `chrome://extensions` in your browser
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked** and select the extension directory
4. The extension is ready to use

## Usage

When you open a Pull Request on GitHub, a control panel will appear in the lower right corner of the page with the following options:

### Auto Load More
Toggle this switch to automatically load all hidden discussions by clicking "Load more..." buttons. The extension will continuously monitor for new "Load more..." buttons and click them automatically.

### Resolve All
Click this button to automatically resolve all unresolved discussions. The extension will:
- Find all discussions that are not yet resolved
- Click the "Resolve discussion" button for each one
- Continue monitoring for newly loaded discussions and resolve them too
- Run for up to 10 seconds to catch dynamically loaded content

### Set as Hidden
Click this button to hide resolved discussions and regular comments. The extension will:
- Identify all resolved discussions and regular comments
- Open the menu for each item and click "Hide" to mark it as outdated
- Skip any parent elements that contain unresolved child discussions
- Handle dynamically loaded content

<img width="1440" alt="Extension activated on GitHub PR" src="https://github.com/Rawdogs-pl/chrome-github-extension/assets/1856485/66addedc-c758-4478-9cfe-ffe5b2ab00c7">

