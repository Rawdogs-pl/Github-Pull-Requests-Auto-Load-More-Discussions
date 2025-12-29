chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: 'OFF'
    });
    chrome.storage.local.set({ extensionState: 'OFF' });
});

const extensionPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\//;

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

chrome.action.onClicked.addListener(async (tab) => {
    if (extensionPattern.test(tab.url)) {
        const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
        const nextState = prevState === 'ON' ? 'OFF' : 'ON';

        await chrome.action.setBadgeText({
            tabId: tab.id,
            text: nextState
        });

        chrome.storage.local.set({ extensionState: nextState });

        if (nextState === 'ON') {
            await chrome.scripting.executeScript({
                files: ['github.js'],
                target: { tabId: tab.id }
            });
        } else if (nextState === 'OFF') {
            await chrome.scripting.executeScript({
                func: stopObserver,
                target: { tabId: tab.id }
            });
        }
    } else {
        console.log('not github page')
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isGitHubPR = extensionPattern.test(tab.url);
        if (isGitHubPR) {
            await chrome.action.setIcon({
                tabId: tabId,
                path: ICON_NORMAL
            });
            await chrome.action.enable(tabId);
            const result = await chrome.storage.local.get(['extensionState']);
            const state = result.extensionState || 'OFF';
            await chrome.action.setBadgeText({
                tabId: tabId,
                text: state
            });
        } else {
            await chrome.action.setIcon({
                tabId: tabId,
                path: ICON_DISABLED
            });
            await chrome.action.disable(tabId);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setBadgeText') {
        chrome.action.setBadgeText({
            tabId: sender.tab.id,
            text: message.text
        });
    }
});

function stopObserver() {
    window.observer.disconnect();
}