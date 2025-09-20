console.log("Tab Auto Archive v1.1");

const UPDATE_AUTOARCHIVE_INTERVAL = 5; // in mins
const DEFAULT_TAB_TIMER = 86400;

// Initilize Timer
browser.storage.local.get("secondsToAutoArchive").then(async db => {
	const secondsToAutoArchive = db.secondsToAutoArchive || DEFAULT_TAB_TIMER;
	await browser.storage.session.set({ secondsToAutoArchive });

	archiveOldTabs();
	resetAutoArchiverInterval(secondsToAutoArchive);
});

// Auto Update Timer
browser.storage.onChanged.addListener(async (changes, area) => {
	if (area != "local") return;

	const secondsToAutoArchive = changes?.secondsToAutoArchive?.newValue;
	if (!Number.isInteger(secondsToAutoArchive)) return;

	await browser.storage.session.set({ secondsToAutoArchive });

	archiveOldTabs();
	resetAutoArchiverInterval(secondsToAutoArchive);
});

browser.alarms.onAlarm.addListener(alarm => {
	if (alarm.name != "AutoArchive") return;

	archiveOldTabs();
});





function resetAutoArchiverInterval(seconds) {
	browser.alarms.clear("AutoArchive");

	seconds = Math.min(seconds, UPDATE_AUTOARCHIVE_INTERVAL * 60)

	console.log("Reset every", seconds, "seconds.");
	browser.alarms.create("AutoArchive", {
		periodInMinutes: seconds / 60,
	});
}

function archiveOldTabs() {
	console.log("Clearing...");
	browser.tabs.query({ currentWindow: true }).then(onArchiveOldTabs);
}

async function onArchiveOldTabs(tabs) {
	const items = await browser.storage.session.get({ secondsToAutoArchive: DEFAULT_TAB_TIMER });
	const secondsToAutoArchive = items.secondsToAutoArchive;

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

	console.log("Closing " + tabIdsToClose.length + " Tabs", tabIdsToClose);
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
