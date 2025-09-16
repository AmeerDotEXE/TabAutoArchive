console.log("Tab Auto Archive v1.0");

let secondsToAutoArchive = 86400;

// Initilize Timer
browser.storage.local.get().then(db => {
	secondsToAutoArchive = db.secondsToAutoArchive || 86400;

	archiveOldTabs();
	setAutoArchiverInterval(secondsToAutoArchive);
});

// Auto Update Timer
browser.storage.onChanged.addListener((changes, area) => {
	if (area != "local") return;

	const newDuration = changes?.secondsToAutoArchive?.newValue;
	if (!Number.isInteger(newDuration)) return;
	
	secondsToAutoArchive = newDuration;
	setAutoArchiverInterval(secondsToAutoArchive);
});

browser.alarms.onAlarm.addListener(alarm => {
	if (alarm.name != "AutoArchive") return;

	// update global var, helps when background service goes inactive.
	secondsToAutoArchive = alarm.periodInMinutes * 60;
	
	archiveOldTabs();
});





function setAutoArchiverInterval(seconds) {
	browser.alarms.clear("AutoArchive");

	console.log("Reset every", seconds, "seconds");
	browser.alarms.create("AutoArchive", {
		periodInMinutes: seconds / 60,
	});
}

function archiveOldTabs() {
	console.log("Clearing...");
	browser.tabs.query({ currentWindow: true }).then(onArchiveOldTabs);
}

function onArchiveOldTabs(tabs) {
	const tabIdsToClose = new Array();
	tabs.forEach(tab => {
		try {
			if (isTabCloseable(tab) == false) {
				tab.lastAccessed = Date.now();
				return;
			}

			const tabLastChecked = Date.now() - tab.lastAccessed;
			if (tabLastChecked / 1000 <= secondsToAutoArchive) return;

			tabIdsToClose.push(tab.id);
		} catch (error) {
			console.error(`AutoArchive Error: ${error}`);
		}
	});

	if (tabIdsToClose.length <= 0) return;

	console.log("Closing "+ tabIdsToClose.length + " Tabs", tabIdsToClose);
	browser.tabs.remove(tabIdsToClose);
}

function isTabCloseable(tab) {
	if (tab.pinned === true) return false;
	// if (tab.discarded === true) return false; // unloaded tabs
	if (tab.autoDiscardable === false) return false;
	if (tab.audible === true) return false;
	if (tab.active === true) return false;
	if (tab.attention === true) return false;
	if (tab.sharingState?.camera === true) return false;
	if (tab.sharingState?.microphone === true) return false;
	if (tab.status !== "complete") return false; // not loaded

	return true;
}
