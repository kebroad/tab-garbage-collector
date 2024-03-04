// Load settings when the popup is opened
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['duration', 'whitelist'], function(data) {
        if (data.duration) {
            document.getElementById('duration').value = data.duration;
        }
        if (data.whitelist) {
            document.getElementById('whitelist').value = data.whitelist.join(', ');
        }
    });
});


document.getElementById('save').addEventListener('click', () => {
    const duration = document.getElementById('duration').value;
    const whitelist = document.getElementById('whitelist').value.split(',');
    chrome.storage.sync.set({ duration, whitelist }, () => {
        console.log('Settings saved');
    });
});