const fs = require("fs/promises");

// Global maps to keep track of leads and emails
const uniqueLeads = new Map(); // Tracks unique leads by `_id`
const emailTracker = new Map(); // Tracks leads by `email`

/**
 *
 * @returns JSON array of leads from 'leads.json'
 */
async function loadLeads() {
	const data = await fs.readFile("./leads.json", "utf8");
	const leads = JSON.parse(data);
	return leads.leads;
}

/**
 * Finds and consolidate duplicate entries
 * @return JSON string in the console of all leads
 */
async function collapseDuplicates() {
	const leads = await loadLeads();

	leads.forEach((lead) => {
		const prevEntryById = uniqueLeads.get(lead?._id);
		const prevEntryByEmail = emailTracker.get(lead?.email);

		if (
			(prevEntryByEmail && !prevEntryById) ||
			(!prevEntryByEmail && prevEntryById)
		) {
			// If one duplicate was found but not the other
			// Get the entry that was duplicated
			const previousEntry = prevEntryByEmail ?? prevEntryById;
			consolidateLeads(previousEntry, lead);
		} else if (prevEntryByEmail && prevEntryById) {
			// If a duplicate was found in both Maps
			const emailMatchedDate = new Date(prevEntryByEmail?.entryDate);
			const idMatchedDate = new Date(prevEntryById?.entryDate);
			const currentLeadDate = new Date(lead?.entryDate);

			// If the current lead is least in date
			// the entry closest in date consoldiates it
			// making the other duplicate no longer a match
			if (
				idMatchedDate > emailMatchedDate &&
				emailMatchedDate > currentLeadDate
			) {
				consolidateLeads(prevEntryByEmail, lead);
			} else if (
				emailMatchedDate > idMatchedDate &&
				idMatchedDate > currentLeadDate
			) {
				consolidateLeads(prevEntryById, lead);
			} else {
				consolidateLeads(prevEntryById, lead);
				consolidateLeads(prevEntryByEmail, lead);
			}
		} else {
			// If no duplicates were found
			uniqueLeads.set(lead._id, lead);
			emailTracker.set(lead.email, lead);
		}
	});

	outputLeads();
}

/**
 * @param previousEntry An Already injested lead.
 * @param newEntry A new lead to injest.
 */
function consolidateLeads(previousEntry, newEntry) {
	const newDate = new Date(newEntry?.entryDate);
	const prevDate = new Date(previousEntry?.entryDate);

	var mostRecent = null;
	var leastRecent = null;
	var parsed = JSON.stringify(previousEntry?.changeLog);
	const changeLog = parsed ? JSON.parse(parsed) : [];

	delete previousEntry?.changeLog;
	if (newDate >= prevDate) {
		mostRecent = newEntry;
		leastRecent = previousEntry;
	} else {
		mostRecent = previousEntry;
		leastRecent = newEntry;
	}
	const combinedRecord = {
		...mostRecent,
		changeLog: [
			{
				before: { ...leastRecent },
				after: { ...mostRecent },
			},
			...changeLog,
		],
	};
	uniqueLeads.delete(previousEntry._id); // Remove old ID entry
	emailTracker.delete(leastRecent.email); // Remove old email entry

	uniqueLeads.set(combinedRecord._id, combinedRecord); // Add merged record
	emailTracker.set(combinedRecord.email, combinedRecord); // Update email mapping
}

/**
 * Prints uniqueLeads.values(), in json format, to console
 */
function outputLeads() {
	const result = Array.from(uniqueLeads.values());
	console.log(JSON.stringify(result, null, 2));
}

collapseDuplicates();
