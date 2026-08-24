# Zoho Backend Automation — Lifecycle_Status Funnel Plan

> **Status: PARTIALLY IMPLEMENTED, as of 2026-08-21.** Live in Zoho today:
> section 1 (Re-engagement/Churned stage writes, as Field Update workflow
> actions in one consolidated rule — no Deluge needed for that part), the
> `msTouchpointWorkflow`/`mstpIntro` trims described under section 1 (Hard
> Refusal branch removed, `Next_Action_Date` write moved to a shared Field
> Update action covering every touchpoint type), and section 2's allow-list
> decision (confirmed, not yet pasted into the live function). **Drafted as
> real Deluge code, not yet deployed:** section 2's actual code change, the
> Dormant schedule (3), the monthly rollover (4), and the agent-task
> automation function (5). Once each is built, update its status here and
> move it into the `zoho/` folder's own docs (see below) rather than
> leaving it only here.
>
> Companion docs: [`PROJECT_STATE.json`](./PROJECT_STATE.json) carries a
> compact pointer to this plan; [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)'s
> "Known gaps" section references it. The widget's own code (`src/`) is
> **not** touched by any of this — the split of responsibility (widget
> captures data, Zoho automation owns stage transitions) stays exactly as
> documented in `DEVELOPER_GUIDE.md`.

## Ground truth this plan is based on

The `zoho/` folder (repo root, sibling to `docs/`) is a **read-only**
snapshot of the live, currently-working Zoho automation — `data_structure.json`
and `workflow_rules.json` are earlier LLM-inferred guesses (flagged
`"assumed": true` throughout), since corrected against the real `.deluge`
function source also in that folder. Do not edit anything in `zoho/` — it's
reference material for analysis, not a deployable copy of anything.

Corrections/confirmations that came out of reading the real Deluge code
(2026-08-21):

- Module API names: `Maintenance_Sales` (= Maintenance Offers, already
  known), `Service_Engagement` (**singular** — the earlier guess had it
  plural), `Maintenance_Request` (**singular**, matches what the widget
  already assumed), `Maintenance_Touchpoints` (plural, confirmed).
- `Maintenance_Request`'s lookup to the company is `Company_Name`, joined
  by **matching display-name text** against `Maintenance_Sales.Name`, not
  by record ID — fragile if two accounts ever share a name, but that's the
  existing production behavior, not something this plan changes.
- There is no `Touchpoint_Result` field (the earlier guess invented one).
  "Hard Refusal" is actually detected as the combo
  `Client_Reaction == "Refused" AND Refusal_Confidence == "Hard"`.
- `Maintenance_Sales.Lifecycle_Status` (picklist) is **the** funnel-stage
  field this whole plan is about. Confirmed full value set: **Onboarded →
  Educated → Activated → Active → Dormant → Re-engagement → Churned**.
  Already-live automation handles the first four transitions:
  - Intro touchpoint created → Onboarded becomes Educated (`mstpIntro`).
  - `Used_Services >= 1` → Activated; `>= 2` → Active (`moTotalUsedChanged`),
    fed by the reactive chain `Maintenance_Request` created/used →
    `Service_Engagement.Times_Used` rollup recalculates → `msseTotalUsedRollup`
    writes `Maintenance_Sales.Total_Used` → that field-update fires
    `moTotalUsedChanged`.
- `Maintenance_Sales.Maturity` field (`Unactivated`/`Trial`, driven by
  `Used_Non_Breakdown_Count`) is being **removed** — no business need for
  it anymore. When the real `moTotalUsedChanged` function is edited, strip
  that logic (and the commented-out `Strategic`/`Embedded`/`Adopting`
  dead code sitting alongside it) at the same time.
- `Maintenance_Sales`'s contact lookup used operationally is `Contact`
  (used as a Task's `Who_Id`), not `Account`.
- **Account is a bridge module only**, owned by a different sales team's
  own pipeline — it connects `Maintenance_Request` and `Maintenance_Sales`
  but this project's automation never needs to read or write it directly.

None of the existing Deluge functions branch on `Conversation_Type` ∈
{Active Client Feedback, Re-engagement, Churned Feedback, Post-service
feedback} at all — `msTouchpointWorkflow` (the function wired to "on
Touchpoint create") only handles Intro and Hard-Refused today. Everything
below is the design to close that gap.

## Spec re-check (`local/Sales - rengagment_churn_active.docx`)

Re-read in full on 2026-08-21 to verify the exact transition conditions.
Relevant points, and how this plan reconciles with each:

- **Dormant → Re-engagement**: spec says agent clicks "Start Re-engagement"
  → stage flips → Re-engagement Form opens. This plan uses **creating a
  Re-engagement touchpoint** as that trigger instead of a separate button —
  same intent, one less UI control. Per the business rule below, the
  Re-engagement form is only ever opened on a client who is currently
  Dormant, so this is a faithful substitution, not a shortcut.
- **Reactivated outcome**: spec explicitly says _"разрешать только при
  наличии нового фактического Service Used — обещание клиента или
  Interested недостаточно... клиент выходит из Re-engagement обратно в
  рабочую стадию по существующей логике воронки"_ — i.e. the spec itself
  says to rely on the existing usage-driven automation, not a direct write
  from the outcome pick. This plan does exactly that (see table below).
- **Not Now / Unable To Reach outcomes**: spec says these transition
  **immediately** to Dormant on save. This plan deliberately does **not**
  do that — per explicit instruction, Dormant is reached _only_ through the
  30-day schedule, never from a touchpoint event. This still satisfies the
  spec's intent in practice: a client only reaches Re-engagement stage
  because they were already Dormant (see business rule below), so their
  `Last_Used_Date` is already >30 days stale by construction. Nothing
  about a Not Now/Unable To Reach outcome resets that date, so the very
  next schedule run flips them back to Dormant on its own — same end
  state, at most one schedule cycle of delay instead of instant.
- **Lost To Competitor / Hard Refusal / Out Of Business**: spec says
  Re-engagement → Churned after the Churn form is filled. Already handled
  by the widget's existing Re-engagement→Churned handoff (see
  `DEVELOPER_GUIDE.md`) — that handoff creates a Churned Feedback
  touchpoint directly, which this plan's Churned-touchpoint rule covers.
- **Active Client Feedback**: spec says negative feedback alone never
  changes stage. No rule below touches `Lifecycle_Status` for this
  Conversation_Type.

## Business rule this plan assumes (confirmed by product, 2026-08-21)

**The Re-engagement form is only ever used on a client who is currently
Dormant.** Agents don't open it speculatively — a client goes Dormant
(automatically, see schedule below), which is the signal to make a
re-engagement call. This is why the touchpoint-driven rules below don't
need to double-check current stage before writing Re-engagement/Churned —
by the time either of those touchpoints exists, the client's prior stage
is already known by process, not by a defensive check in code.

## Rules to add

### 1. Touchpoint-driven Lifecycle_Status writes — ✅ LIVE

No outcome branching — the touchpoint's `Conversation_Type` alone decides:

| Event                                                                                                                            | New `Lifecycle_Status`                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Re-engagement touchpoint created (`Call_Outcome` = Connected)                                                                    | → **Re-engagement**, unconditionally                                                                                 |
| Churned Feedback touchpoint created (`Call_Outcome` = Connected) — direct pick or via the widget's Re-engagement→Churned handoff | → **Churned**, unconditionally                                                                                       |
| Active Client Feedback touchpoint created                                                                                        | _(no change)_                                                                                                        |
| Post-service feedback touchpoint created                                                                                         | _(no change — usage-driven Activated/Active transition already happens independently via the existing rollup chain)_ |

**Built 2026-08-21, live in Zoho** as a single consolidated workflow rule
on `Maintenance_Touchpoints` ("on create"), with three condition branches
— this replaced the old standalone "MS Touchpoint Created" rule entirely
(deleted, not left running alongside it, so `MS Touchpoint Workflow` fires
exactly once per touchpoint, not twice):

| Branch | Criteria | Instant actions |
|---|---|---|
| Condition 1 | `Conversation_Type` = Re-engagement AND `Call_Outcome` = Connected | Field Update "Re-engagement" (→ `Maintenance_Sales.Lifecycle_Status`), the shared "MO Next Action Date" Field Update, Function "MS Touchpoint Workflow" |
| Condition 2 | `Call_Outcome` = Connected AND `Conversation_Type` = Churned Feedback | Field Update "MS Churned" (→ `Lifecycle_Status`), the same shared "MO Next Action Date" Field Update, Function "MS Touchpoint Workflow" |
| Others | Anything not matching 1 or 2 (includes every non-Connected call of any type, plus Intro/Post-service feedback/Active Client Feedback) | The same shared "MO Next Action Date" Field Update, Function "MS Touchpoint Workflow" — no `Lifecycle_Status` action |

The "MO Next Action Date" Field Update is **one reusable action**
referenced by all three branches, not three separate copies — resolves
the earlier concern about it being configured three times independently.
No Deluge function needed for the stage writes after all; the two
`mstpReengagement`/`mstpChurned` standalone functions floated earlier in
this doc's history were never built, superseded by this native approach.

Since that leaves the actual `msTouchpointWorkflow` function not needing
any new branches for stage writes, here's the full updated function, with
explicit comment coverage for every `Conversation_Type` — including the
ones that intentionally do nothing here — so nothing reads as forgotten.

**Also live as of 2026-08-21, done by the user directly in Zoho:**
- The Hard-Refusal branch (`mstpRefused`) was **removed** from this
  function — the live `mstpRefused` standalone function is now dead code,
  never called from anywhere. Worth deleting it in Zoho Setup too, or at
  least noting it's orphaned, so a future reader doesn't assume it still
  fires.
- `mstpIntro` no longer writes `Next_Action_Date` onto `Maintenance_Sales`
  itself — that write moved out of Deluge entirely into a **Field Update
  workflow action**, and (per the same change) it now fires for **every**
  touchpoint type, not just Intro. This closes the gap flagged earlier in
  this doc's history, where Post-service feedback / Active Client
  Feedback / Re-engagement / Churned Feedback touchpoints never updated
  `Maintenance_Sales.Next_Action_Date` at all. `mstpIntro` now does
  nothing except the `Lifecycle_Status` Onboarded→Educated bump.

```deluge
void automation.msTouchpointWorkflow(Int tpId,Int ownerId)
{
tpRecord = zoho.crm.getRecordById("Maintenance_Touchpoints",tpId);
conversationType = tpRecord.get("Conversation_Type");
callOutcome = tpRecord.get("Call_Outcome");

if(callOutcome == "Connected" && conversationType == "Intro" && tpRecord.get("Client_Reaction") != "Refused")
{
	// Only remaining job: Lifecycle_Status Onboarded -> Educated.
	// Next_Action_Date is no longer written here — see the Field Update
	// workflow action note above, which now covers every touchpoint type.
	standalone.mstpIntro(tpId,ownerId);
}
// Hard Refusal branch removed 2026-08-21 — mstpRefused is no longer called
// from anywhere; consider deleting the function itself in Zoho Setup.
// Post-service feedback: nothing to do here — the rating fields land on
// Maintenance_Request directly (see msUpdateServiceUsage), and any
// Activated/Active transition happens independently via the existing
// Maintenance_Request -> Service_Engagement -> Maintenance_Sales rollup
// chain, not from this touchpoint.
// Active Client Feedback: deliberately nothing here — negative feedback
// alone must never change Lifecycle_Status (spec requirement).
// Re-engagement / Churned Feedback: Lifecycle_Status is set to
// "Re-engagement" / "Churned" by the Field Update workflow actions above,
// not Deluge — nothing to do for those here either. Don't re-add
// mstpReengagement/mstpChurned branches; superseded.

// Every touchpoint, regardless of type or outcome, gets (or supersedes)
// its own follow-up/retry task — see section 5 below for the per-type
// subject/skip logic and the auto-close behavior.
standalone.mstpCreateFollowTask(tpId,ownerId);
}
```

### 2. Reactivation guard in `moTotalUsedChanged`

The live function that sets Activated/Active from `Used_Services` has no
awareness of the client's *current* stage — it would silently flip a
Churned or Dormant client back to Activated/Active off a stray new
`Maintenance_Request`, contradicting the spec's requirement that Churned
only ends via a human decision. Per instruction (2026-08-21): the write is
now only allowed **from** `Educated` or `Re-engagement` — never from
`Dormant` or `Churned` (and, since it wasn't named as an allowed source
either, not from `Onboarded`).

**Confirmed 2026-08-21:** `Activated`/`Active` stay in the allow-list too.
Reasoning (from the user, not just "keep it working as before"):
`Used_Services` is a cumulative count — old `Maintenance_Request` records
are never deleted, so an already-`Active` client (≥2 historically) can
never actually regress to just `Activated` through this function; the
thresholds are monotonic. Keeping both in the allow-list is therefore not
a loophole, just lets normal continued usage keep updating the record as
it always has.

```deluge
void automation.moTotalUsedChanged(Int moId)
{
query = "Select id, Used_Services, Lifecycle_Status from Maintenance_Sales where id=" + moId;
queryMap = Map();
queryMap.put("select_query",query);
response = invokeurl
[
	url :"https://www.zohoapis.com/crm/v8/coql"
	type :POST
	parameters:queryMap.toString()
	connection:"crmfile"
];
msRecord = response.get("data").get(0);
allowedSourceStages = {"Educated","Activated","Active","Re-engagement"};
if(!allowedSourceStages.contains(msRecord.get("Lifecycle_Status")))
{
	return;
}
updMap = Map();
if(msRecord.get("Used_Services") >= 1)
{
	updMap.put("Lifecycle_Status","Activated");
}
if(msRecord.get("Used_Services") >= 2)
{
	updMap.put("Lifecycle_Status","Active");
}
zoho.crm.updateRecord("Maintenance_Sales",moId,updMap);
}
```

This is also where the `Maturity` field logic gets removed (per instruction
to drop it — no business need anymore): the query above no longer selects
`Used_Non_Breakdown_Count`, and there's no `Maturity`-setting logic left —
compare against the live function in `zoho/functions/moTotalUsedChanged.deluge`
to see exactly what's being cut.

### 3. Dormant schedule — the _only_ path to Dormant

A time-based schedule (Zoho Setup → Automation → Schedules, not a workflow
rule), suggested daily:

- **Eligible current stages**: Activated, Active, Re-engagement.
- **Not eligible**: Onboarded, Educated — they may have no `Last_Used_Date`
  at all yet, so "no cases in 30 days" would be trivially true from day one
  and misfire immediately. This exclusion is load-bearing now that this is
  the single Dormant mechanism.
- **Condition**: `Last_Used_Date` older than 30 days.
- **Action**: `Lifecycle_Status` → Dormant, and create a Task (mirroring
  the existing `mstpCreateFollowTask` pattern) — this is what satisfies the
  spec's "CRM creates a Re-engagement Task" requirement, and is what
  eventually prompts an agent to make the re-engagement call.
- COQL calls can return up to 2000 rows per call (corrected from an
  earlier assumption of 200) — one call comfortably covers the client list
  unless it grows past that, at which point a simple offset loop would be
  needed.
- **Bulk, not per-record.** Per instruction (2026-08-21): don't
  `zoho.crm.updateRecord`/`createRecord` in a loop, one call per client —
  inefficient at any real scale. Batch the stage update via the CRM v8
  "update multiple records" REST endpoint (max 100 records per call, so
  chunked) and batch the Task creation via `zoho.crm.bulkCreate`.

```deluge
void schedule.moDormantCheck()
{
cutoff = zoho.currentdate.subDay(30).toString("yyyy-MM-dd");
coqlQuery = "select id, Owner, Contact, Name from Maintenance_Sales where Lifecycle_Status in ('Activated','Active','Re-engagement') and Last_Used_Date <= '" + cutoff + "' limit 2000";
coqlResp = standalone.uLib("coql",{"query":coqlQuery});
dormantRecords = coqlResp.get("data");
if(dormantRecords.size() == 0)
{
	return;
}
updateList = List();
taskList = List();
for each  msRecord in dormantRecords
{
	updateList.add({"id":msRecord.get("id"),"Lifecycle_Status":"Dormant"});
	taskMap = Map();
	taskMap.put("Subject","Re-engagement needed: " + msRecord.get("Name") + " went Dormant");
	taskMap.put("$se_module","Maintenance_Sales");
	taskMap.put("What_Id",msRecord.get("id"));
	taskMap.put("Who_Id",msRecord.get("Contact").get("id"));
	taskMap.put("Owner",msRecord.get("Owner").get("id"));
	taskMap.put("Due_Date",zoho.currentdate);
	taskMap.put("Status","Not Started");
	taskMap.put("Send_Notification_Email",true);
	taskMap.put("Description","No service usage recorded in the last 30 days. Client moved to Dormant automatically — make a re-engagement call to restart.");
	taskList.add(taskMap);
}
// Zoho's bulk-update REST endpoint caps at 100 records per call — chunk both
// lists together (they're built in the same order, index-for-index).
index = 0;
while(index < updateList.size())
{
	chunkEnd = if(index + 100 < updateList.size(), index + 100, updateList.size());
	updateBody = Map();
	updateBody.put("data", updateList.subList(index,chunkEnd));
	invokeurl
	[
		url :"https://www.zohoapis.com/crm/v8/Maintenance_Sales"
		type :PUT
		parameters:updateBody.toString()
		connection:"crmfile"
	];
	zoho.crm.bulkCreate("Tasks", taskList.subList(index,chunkEnd));
	index = index + 100;
}
}
```

### 4. Monthly rollover schedule — 1st of every month

Runs on every `Service_Engagement` and `Maintenance_Sales` record (both
carry `Total_This_Month`/`Total_Last_Month`). **No recomputation** — a
plain field shift:

```
Total_Last_Month = current Total_This_Month
Total_This_Month = 0
```

The existing reactive per-event accumulation (`msseTotalTurnover` /
`msUpdateMonthlyUsage`, fired whenever a new `Maintenance_Request` lands)
is untouched and keeps doing the real COQL-based this-month-window math
during the month — this schedule only performs the rollover step at the
month boundary. Same bulk-update requirement as the Dormant schedule
applies here — this was drafted per-record originally and has been
corrected to match:

```deluge
void schedule.msMonthlyRollover()
{
seCoql = "select id, Total_This_Month from Service_Engagement limit 2000";
seResp = standalone.uLib("coql",{"query":seCoql});
seUpdateList = List();
for each  se in seResp.get("data")
{
	seUpdateList.add({"id":se.get("id"),"Total_Last_Month":ifNull(se.get("Total_This_Month"),0),"Total_This_Month":0});
}
index = 0;
while(index < seUpdateList.size())
{
	chunkEnd = if(index + 100 < seUpdateList.size(), index + 100, seUpdateList.size());
	body = Map();
	body.put("data", seUpdateList.subList(index,chunkEnd));
	invokeurl
	[
		url :"https://www.zohoapis.com/crm/v8/Service_Engagement"
		type :PUT
		parameters:body.toString()
		connection:"crmfile"
	];
	index = index + 100;
}

msCoql = "select id, Total_This_Month from Maintenance_Sales limit 2000";
msResp = standalone.uLib("coql",{"query":msCoql});
msUpdateList = List();
for each  ms in msResp.get("data")
{
	msUpdateList.add({"id":ms.get("id"),"Total_Last_Month":ifNull(ms.get("Total_This_Month"),0),"Total_This_Month":0});
}
index = 0;
while(index < msUpdateList.size())
{
	chunkEnd = if(index + 100 < msUpdateList.size(), index + 100, msUpdateList.size());
	body = Map();
	body.put("data", msUpdateList.subList(index,chunkEnd));
	invokeurl
	[
		url :"https://www.zohoapis.com/crm/v8/Maintenance_Sales"
		type :PUT
		parameters:body.toString()
		connection:"crmfile"
	];
	index = index + 100;
}
}
```

Note: both schedules read up to 2000 records per COQL call (the read
side). If the candidate count ever exceeds 2000, the read itself would
also need an offset loop — not built here since it's not a real concern
yet, just worth knowing the cap applies to both directions.

### 5. Agent task automation — meaningful subjects + auto-close

Drop-in replacement for `mstpCreateFollowTask` (same
`standalone.mstpCreateFollowTask(tpId, ownerId)` signature, so
`msTouchpointWorkflow`'s existing call site doesn't change). Two things it
adds beyond the current live version: a subject/due-date chosen by the
touchpoint's own fields instead of one generic wording every time, and
auto-closing whatever agent task was already open on this client before
creating the new one — otherwise a client with a long call history just
accumulates open "next action" tasks forever, most already fulfilled.

```deluge
string standalone.mstpCreateFollowTask(Int tpId,Int ownerId)
{
tpRecord = zoho.crm.getRecordById("Maintenance_Touchpoints",tpId);
msId = tpRecord.get("Maintenance_Offers").get("id");
msRecord = zoho.crm.getRecordById("Maintenance_Sales",msId);

// 1. Auto-close whatever agent task was already open on this client — a new
// touchpoint always supersedes whatever "next action" was pending, regardless
// of which conversation type this new one turns out to be.
openTasksQuery = "select id from Tasks where What_Id = " + msId + " and Status != 'Completed'";
openTasksResp = standalone.uLib("coql",{"query":openTasksQuery});
closeList = List();
for each  t in openTasksResp.get("data")
{
	closeList.add({"id":t.get("id"),"Status":"Completed"});
}
if(closeList.size() > 0)
{
	closeBody = Map();
	closeBody.put("data", closeList);
	invokeurl
	[
		url :"https://www.zohoapis.com/crm/v8/Tasks"
		type :PUT
		parameters:closeBody.toString()
		connection:"crmfile"
	];
}

// 2. Decide this touchpoint's own subject / due date / whether to skip
// creating a new task at all, based on its fields.
conversationType = tpRecord.get("Conversation_Type");
callOutcome = tpRecord.get("Call_Outcome");
subject = "";
dueDate = tpRecord.get("Next_Action_Date");
skip = false;

if(callOutcome != "Connected")
{
	subject = "Retry contact attempt - " + conversationType;
}
else if(conversationType == "Intro" && tpRecord.get("Client_Reaction") == "Refused" && tpRecord.get("Refusal_Confidence") == "Soft")
{
	subject = "Re-approach after soft refusal";
}
else if(conversationType == "Intro")
{
	subject = "Follow up - Intro call";
}
else if(conversationType == "Post-service feedback")
{
	subject = "Follow up - Post-service feedback";
}
else if(conversationType == "Active Client Feedback")
{
	subject = "Follow up - Active Client check-in";
}
else if(conversationType == "Re-engagement" && tpRecord.get("Re_Engagement_Outcome") == "Not Now")
{
	subject = "Re-engagement review";
}
else if(conversationType == "Re-engagement")
{
	subject = "Follow up - Re-engagement";
}
else if(conversationType == "Churned Feedback")
{
	// Per spec: the churned process ends here — no separate win-back task.
	skip = true;
}
else
{
	subject = "Next action was planned on " + dueDate;
}

if(skip || isNull(dueDate) || dueDate == "")
{
	return "";
}

targetDate = dueDate.toDate();
mp = Map();
mp.put("Subject", subject);
mp.put("$se_module","Maintenance_Sales");
mp.put("What_Id", msId);
mp.put("Who_Id", msRecord.get("Contact").get("id"));
mp.put("Owner", ownerId);
mp.put("Due_Date", targetDate);
reminderDateTime = targetDate.toString("yyyy-MM-dd") + "T19:30:00+05:00";
mp.put("Remind_At",{"ALARM":"FREQ=NONE;ACTION=POPUP;TRIGGER=DATE-TIME:" + reminderDateTime});
mp.put("Status","Not Started");
mp.put("Send_Notification_Email",true);

desc = "";
if(!isNull(tpRecord.get("Summary_Notes")))
{
	desc = desc + "Last touchpoint summary: " + tpRecord.get("Summary_Notes") + ". ";
}
desc = desc + "Conversation_Type: " + conversationType + ". ";
desc = desc + "Call Outcome: " + callOutcome + ". ";
if(conversationType == "Intro")
{
	desc = desc + "Client Reaction: " + tpRecord.get("Client_Reaction") + ". ";
	desc = desc + "Services Discussed: " + tpRecord.get("Services_Discussed") + ". ";
	if(tpRecord.get("Client_Reaction") == "Refused")
	{
		desc = desc + "Refusal Reason: " + tpRecord.get("Refusal_Reason") + ". ";
		desc = desc + "Refusal Confidence: " + tpRecord.get("Refusal_Confidence") + ". ";
	}
}
else if(conversationType == "Re-engagement")
{
	desc = desc + "Reason Stopped: " + tpRecord.get("Reason_Stopped") + ". ";
	desc = desc + "Re-engagement Outcome: " + tpRecord.get("Re_Engagement_Outcome") + ". ";
}
mp.put("Description", desc);

createTask = zoho.crm.createRecord("Tasks", mp);
return "";
}
```

**Reconsidered same day (2026-08-21):** an earlier version of this plan
had the "Not Now" outcome use a separate `Next_Review_Date` field as its
due date instead of `Next_Action_Date`, with `ReEngagementForm.vue`
updated to match. That was reverted — product decided `Next_Action_Date`
should be used consistently across every outcome and every form, so
"Not Now" now behaves the same as every other Re-engagement outcome here:
same due date source, just its own subject wording. `Next_Review_Date` no
longer exists anywhere in the widget or this plan.

**Decided 2026-08-21:** Active Client Feedback sticks with `Next_Action_Date`
like every other conversation type — the fleet-size-based cadence task
idea (a separate `Next_Client_Feedback_Date` schedule) from the original
task-ideas discussion is dropped for now, not just blocked on the missing
fleet-size field. The code above already matches this: no special-cased
due date for Active Client Feedback, same as it's always been.

**Owned by the user, not an open question for Claude:** the COQL filter
`What_Id = X and Status != 'Completed'` — verifying the exact comparison
syntax a live Zoho instance accepts for a polymorphic `What_Id` lookup is
being checked directly, not something to resolve here.

**Still open:**
- Churned Feedback (Connected) creates no new task at all, only closes
  what's open — matches "no separate win-back process," but was floated,
  not firmly decided. Say if a task should exist there instead.

## Open items before this gets built

- Section 1 is live (including the `msTouchpointWorkflow`/`mstpIntro`
  trims and the consolidated workflow rule). Section 2's allow-list is
  now fully confirmed. Sections 2–5 are still just drafted Deluge code,
  not yet pasted into Zoho — that's the next step when you're ready.
- Once 2–4 are built, the corresponding entries in
  `zoho/data_structure.json` / `zoho/workflow_rules.json` should be
  updated by whoever maintains that folder (not by editing it
  speculatively ahead of the real Zoho change).
