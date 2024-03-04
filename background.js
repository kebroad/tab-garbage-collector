// Global object to keep track of tab activation times
let tabTimes = {};

// Load tab activation times from storage
chrome.storage.local.get(['tabTimes'], (result) => {
    if (result.tabTimes) {
        tabTimes = result.tabTimes;
    }
});

// Function to update a tab's last active time and save it to storage
function updateTabTime(tabId) {
    tabTimes[tabId] = Date.now();
    chrome.storage.local.set({tabTimes: tabTimes});
}

// Listen for when a tab is updated or activated to record its last active time
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        updateTabTime(tabId);
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    updateTabTime(activeInfo.tabId);
});


// Periodically check tabs to see if any should be closed
chrome.alarms.create("checkTabs", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "checkTabs") {
        checkTabsAndClose();
    }
});

// Function to check tabs against the user-defined duration and whitelist
function checkTabsAndClose() {
    chrome.storage.sync.get(['duration', 'whitelist'], (data) => {
        if (!data.duration) {
            data.duration = 60; // Default to 60 minutes if not set
        }
        if (!data.whitelist) {
            data.whitelist = []; // Default to an empty array if not set
        }
        // Get the latest tabTimes from storage
        chrome.storage.local.get(['tabTimes'], (result) => {
            if (result.tabTimes) {
                tabTimes = result.tabTimes;
            }
        });

        chrome.tabs.query({}, (tabs) => {
            const now = Date.now();
            tabs.forEach((tab) => {
                const tabTime = tabTimes[tab.id];
                if (tabTime && (now - tabTime) >= data.duration * 60000) {
                    if (data.whitelist.some(domain => tab.url && tab.url.includes(domain))) {
                        return; // Skip this tab
                    }
                    chrome.tabs.remove(tab.id); // Close the tab
                }
            });
        });
    });
}

// Clean up tabTimes object when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabTimes[tabId]) {
        delete tabTimes[tabId];
        chrome.storage.local.set({tabTimes: tabTimes});
    }
});