
const archiveDurationElement = document.getElementById("archiveTimeNumber");
const archiveDurationTypeElement = document.getElementById("archiveTimeType");

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);



function saveOptions(e) {
	e.preventDefault();

	const duration = parseInt(archiveDurationElement.value);
	if (!Number.isFinite(duration)) {
		alert("Please input a valid number for AutoArchive...");
		return;
	}

	let durationMultiplier = 1;

	switch (archiveDurationTypeElement.value) {
		case "seconds": { durationMultiplier = 1; break; }
		case "minutes": { durationMultiplier = 60; break; }
		case "hours": { durationMultiplier = 60 * 60; break; }
		case "days": { durationMultiplier = 24 * 60 * 60; break; }
	}

	browser.storage.local.set({
		secondsToAutoArchive: durationMultiplier * duration,
	});
}

function restoreOptions() {
	browser.storage.local.get("secondsToAutoArchive")
	.then(updateCurrentChoices);

	function updateCurrentChoices(result) {
		const duration = result.secondsToAutoArchive;
		if (!Number.isFinite(duration)) return;

		archiveDurationElement.value = duration;
		archiveDurationTypeElement.value = "seconds";

		if (duration % (24 * 60 * 60) === 0) {
			archiveDurationTypeElement.value = "days";
			archiveDurationElement.value = duration / (24 * 60 * 60);
		} else if (duration % (60 * 60) === 0) {
			archiveDurationTypeElement.value = "hours";
			archiveDurationElement.value = duration / (60 * 60);
		} else if (duration % 60 === 0) {
			archiveDurationTypeElement.value = "minutes";
			archiveDurationElement.value = duration / 60;
		}
	}
}
