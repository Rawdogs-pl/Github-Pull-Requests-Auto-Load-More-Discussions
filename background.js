chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ autoLoadMoreEnabled: false });
});

// Pattern matches PR URLs: https://github.com/{owner}/{repo}/pull/{number}
// This ensures extension only activates on actual PR pages, not agents pages
// Note: This pattern is duplicated in github.js for content script validation
const extensionPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/;

const ICON_NORMAL = {
    "16": "images/icon.png",
    "32": "images/icon.png",
    "48": "images/icon.png",
    "128": "images/icon.png"
};

const ICON_DISABLED = {
    "16": "images/icon-disabled.png",
    "32": "images/icon-disabled.png",
    "48": "images/icon-disabled.png",
    "128": "images/icon-disabled.png"
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const url = changeInfo.url ?? tab.url;

    if (changeInfo.status === 'complete') {
        const isGitHubPR = typeof url === 'string' && extensionPattern.test(url);
        if (isGitHubPR) {
            await chrome.action.setIcon({
                tabId: tabId,
                path: ICON_NORMAL
            });
            await chrome.action.enable(tabId);
        } else {
            await chrome.action.setIcon({
                tabId: tabId,
                path: ICON_DISABLED
            });
            await chrome.action.disable(tabId);
        }
    }
});