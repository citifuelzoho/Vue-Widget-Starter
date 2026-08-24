# Touchpoint Widget — Developer Handoff

> Kept in sync with the code — if a form's architecture, known gaps, or
> known bugs change, this file is updated in the same change, the same way
> `AGENT_GUIDE.md` is. If something here doesn't match what you see in the
> code, the app has moved ahead of this doc; flag it so it can be corrected.
> For what the widget does from an _agent's_ point of view (no technical
> detail), see [`AGENT_GUIDE.md`](./AGENT_GUIDE.md). For a machine-readable
> dump of this same state (routing table, per-form field/branch maps,
> known bugs/gaps, open questions) meant for handing off to a new AI
> session rather than for a person to read, see
> [`PROJECT_STATE.json`](./PROJECT_STATE.json). For the Zoho page layout
> itself (field reference + Layout Rules), see
> [`TOUCHPOINT_LAYOUT.md`](./TOUCHPOINT_LAYOUT.md) and
> [`LAYOUT_RULES_TRIGGER_LIST.md`](./LAYOUT_RULES_TRIGGER_LIST.md). For the
> designed-but-not-yet-built Zoho-side funnel-stage automation, see
> [`ZOHO_AUTOMATION_PLAN.md`](./ZOHO_AUTOMATION_PLAN.md).

## What this is

A Zoho CRM widget (Vue 3 + Vite, packaged with `zet`) that opens from a
**Maintenance Offer** record. A sales agent picks what kind of conversation
they had with the client, and depending on the answer, fills out one of six
forms. Submitting creates a **Maintenance_Touchpoints** record (and, for one
form, also updates related **Maintenance_Request** records). That's the
entire scope of the app — it's a structured call-logging form, not a
dashboard or a report.

## Stack & build

- Vue 3 `<script setup>` SFCs, no router, no state library beyond a couple
  of plain `ref()`s.
- Vite bundles to `app/` (`vite.config.js`: `outDir: 'app'`,
  `emptyOutDir: true` — this was a real bug once, see below).
- `zet pack` wraps `app/` into `dist/touchpoint_widget.zip`, the actual
  artifact uploaded to Zoho.
- `npm run build` = `vite build && zet pack`. Run this after any `src/`
  change before testing in Zoho — `vite build` alone only refreshes `app/`,
  not the zip.
- **You cannot exercise `ZOHO.CRM.*` calls locally.** `npm run dev` renders
  the UI but every `ZOHO.CRM.API`/`ZOHO.CRM.UI` call will throw or no-op,
  since those only exist inside the real Zoho iframe context. There is no
  local mock for them. All real testing happens by rebuilding, re-uploading
  the zip to Zoho, and clicking through it there — which makes each test
  cycle expensive, so read the code carefully before assuming something is
  broken.
- ESLint + Prettier are configured but this project does not run
  `format`/`format:check` as part of the normal edit loop — the editor
  formats on save. `npm run lint` is still useful for catching real bugs
  (unused vars, undefined references) separately from style.

## How a submission actually works

Every form's submit handler follows the same shape:

```js
async function submitX() {
  isLoading.value = true
  const apiData = {/* ...gathered from local refs... */}
  await createTouchpoint(apiData).finally(() => {
    isLoading.value = false
  })
  alert('...')
  setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
}
```

`createTouchpoint` (`src/utils/touchpoint.js`) wraps
`ZOHO.CRM.API.insertRecord` targeting the `Maintenance_Touchpoints` module.
**Nothing anywhere checks the per-record `status`/`code` Zoho returns** — a
"successful" `.then()` doesn't actually guarantee the record saved. This has
been a known gap since early in the project and was never addressed; it
applies to every form.

**Fixed 2026-08-21 — reactive-Proxy clone failure.** `createTouchpoint`
(and `updateMaintenanceRequests`) now deep-clone their input via
`JSON.parse(JSON.stringify(...))` before handing it to `ZOHO.CRM.API`.
Any multiselect field built as `someRef.value` directly (every form does
this — `Services_Discussed`, `Client_Likes`, `Target_Service`, etc.) stays
a Vue reactive `Proxy`, not a plain array, since assigning `.value` copies
the reference, not a deep copy. `insertRecord` hands data to the parent
frame via `postMessage` internally, and a Proxy can't survive that
structured-clone step — surfaced first as `ReEngagementForm` throwing
`[object Object] could not be cloned` on submit (caught via
`console.log(reEngagementFields)` showing `Target_Service`/
`What_Can_Bring_Client_Back` as `Proxy(Array)` instead of a plain array),
but every form with a multiselect field had the same latent bug. Fixed
centrally in the two shared utility functions rather than per-form, so it
can't recur as new fields/forms get added.

**Field names were inferred from the spec's on-screen labels, and as of
2026-08-20 that's now been confirmed against a real Zoho layout export**
(`local/layout.json`, gitignored) rather than left as a standing risk:
39 of 41 checked picklist/multi-select fields across all 8 layout sections
match `select-options.js` exactly, value-for-value, in the same order —
field names, section grouping, and option lists are all correct. The 2
exceptions were real data-integrity issues in the _live Zoho picklists_
(not code bugs): `Conversation_Type` was missing `Active Client Feedback`
and `Churned Feedback` as picklist values, and `Main_Reason` had `Trust`
and `Driver Preference` merged into one value. Both have since been fixed
directly in Zoho Setup (2026-08-20) — see the resolved-issue notes in
[`TOUCHPOINT_LAYOUT.md`](./TOUCHPOINT_LAYOUT.md) Sections 1 and 3 for what
was wrong. If a similar layout export is pulled again in the future and
something new doesn't match, re-run this same diff before assuming it's a
code bug.

The other module this widget writes to, `Maintenance_Request` (the 5
fields `PostServiceFeedbackForm` bulk-updates — see the field reference
below), is now confirmed correct too, as of 2026-08-21 — not via a layout
export this time, but directly from the user: that feedback data is
saving correctly in production. No field name anywhere in this app remains
unverified.

## App structure

```
src/
  main.js                 — ZOHO.embeddedApp bootstrap, fixed 1200×750 popup resize
  App.vue                 — routes on appState.page, wraps forms in v-auto-animate
  store.js                — shared appState (see below)
  store/user.js           — useUserStore() composable, fetches current CRM user
  store/handoff.js        — one-shot bridge for the Re-engagement→Churned handoff
  store/maintenanceOffer.js — useMaintenanceOfferStore() composable, fetches the
                              current Maintenance_Sales record (HomeForm only)
  config/select-options.js — every dropdown/multi-select option list, sectioned
                              by which form(s) consume them
  utils/touchpoint.js     — createTouchpoint(apiData)
  utils/maintenanceRequests.js — updateMaintenanceRequests(ids, fields)
  components/
    Base*.vue             — Select / MultiSelect / Input / Textarea / Button
    TablePagination.vue   — used only by Post-Service Feedback's request table
    Clock.vue             — unused leftover from the original scaffold; not
                             imported anywhere, safe to delete
    forms/
      HomeForm.vue                  — entry screen, routes to the rest
      IntroForm.vue
      PostServiceFeedbackForm.vue
      ActiveClientFeedbackForm.vue
      ReEngagementForm.vue
      ChurnedFeedbackForm.vue
      ReasonBranchFields.vue        — shared conditional-field tree (see below)
```

### `appState` (`src/store.js`)

Deliberately thin — a refactor mid-project moved almost everything out of
shared state and into local refs per form, after the shared version became
hard to maintain:

```js
export const appState = ref({
  conversationType: '',
  callOutcome: '',
  entityId: '',
  page: 'home'
})
```

Only what's genuinely needed everywhere lives here: which page to render,
and the three fields every touchpoint payload includes
(`Maintenance_Offers`/`Conversation_Type`/`Call_Outcome`). Everything else —
every form-specific field — is a local `ref()` inside that form's own
`<script setup>`. Don't add anything to `appState` that only one form needs.

### Routing

There's no router. `App.vue` renders exactly one form based on
`appState.page`, a plain string compared with `v-if` across six branches.
Two places set `page`:

- `HomeForm.vue`'s `submitHomeForm()` — the normal path, based on which
  `Conversation option` the agent picked.
- `ReEngagementForm.vue`'s `createReEngagementTouchpoint()` — the one
  exception, see the handoff section below.

If you add a seventh form, you need to touch three places: `App.vue` (new
`v-if` branch + import), `HomeForm.vue`'s if/else-if chain, and
`select-options.js`'s `ConversationTypes` list. All three must use the
exact same string — there's no shared constant for page names or
conversation-type values, just matching string literals. (This has been
manually verified correct as of this snapshot, but there's nothing
structural preventing future drift — worth keeping in mind.)

## Application flow and logic

The macro flow, every path from opening the widget to it closing:

```
HomeForm (page: home)
 ├─ Conversation option (ConversationTypes) + Call outcome (CallOutcomeOptions), both required
 │
 ├─ Call outcome != 'Connected'  (isNotConnected computed)
 │    └─ show Next Action Date → Submit → createTouchpoint → alert → closeReload
 │       (terminal for every Conversation option — no further form)
 │
 └─ Call outcome == 'Connected'  → "Next" routes by Conversation option:
      ├─ Intro                  → page: intro
      ├─ Post-service feedback  → page: post-service-feedback
      ├─ Active Client Feedback → page: active-client-feedback
      ├─ Re-engagement          → page: re-engagement
      └─ Churned Feedback       → page: churned-feedback

ReEngagementForm submit has a second branch point (see the handoff
section below for the full mechanics):
  isClosingReEngagement === 'Yes' AND outcome ∈ {Lost To Competitor, Hard
  Refusal, Out Of Business}
    → skips createTouchpoint entirely, hands off state, page: churned-feedback
  otherwise
    → createTouchpoint → alert → closeReload, same as every other form
```

Per-form internal logic — the conditional gating that decides what's on
screen and what ends up in the payload:

- **HomeForm** — `isNotConnected` is the only gate; it both shows/hides the
  Next Action Date field and switches the submit handler between the
  terminal "log the miss" path and the "route to a form" path. The submit
  button's label (`Next` vs `Submit` vs `Submitting...`) is driven by the
  same computed plus `isLoading`. Also fetches the current `Maintenance_Sales`
  record on mount via `useMaintenanceOfferStore()` (fire-and-forget, same
  pattern as `fetchUser()`) and filters the Conversation option dropdown
  through `availableConversationTypes`, a computed that looks up the
  fetched `Lifecycle_Status` in `AllowedConversationTypesByLifecycleStatus`
  (`select-options.js`) — falls back to showing every `ConversationTypes`
  value if the record hasn't loaded yet or the stage isn't in the map, so a
  slow fetch never blocks the form. This mapping is explicitly marked
  **draft, not product-confirmed** in its own comment — see
  `ZOHO_AUTOMATION_PLAN.md` for the `Lifecycle_Status` values it depends on.

- **IntroForm** — flat, one level of conditional: `clientReaction ===
'Refused'` gates both `Refusal_Reason` and `Refusal_Confidence`. No
  shared component involved. Payload guards mirror the display condition
  directly (`clientReaction.value === 'Refused' ? refusalReason.value :
''`), so there's no drift possible between what's shown and what's sent.

- **PostServiceFeedbackForm** — the odd one out: it doesn't have a reason
  tree at all, and it writes to _two_ modules, not one (see the field
  reference below). Its only real conditional logic is the request table:
  `selectedRequests.length` gates the submit button (must select ≥1), and
  changing the page or the rows-per-page limit resets the selection
  (`handleLimitChange`/`goToPrevPage`/`goToNextPage` all clear
  `selectedRequests` before refetching) — otherwise a selection could
  silently point at IDs no longer shown, or belonging to a different page.
  **`Shop_Rating`/`Maintenance_Agent_Rating` are per-row, not one shared
  value** (changed 2026-08-21 — a single call can cover requests serviced
  by different shops/agents). `shopRatings`/`agentRatings` are plain
  objects keyed by request id (`ref({})`, not arrays), read/written via
  bracket access in the template (`shopRatings[request.id]`) — Vue's
  top-level-ref auto-unwrap in `<script setup>` templates makes this work
  without `.value`. Both maps get fully replaced (not merged) inside
  `fetchRequests()` every time `reqData` changes, keyed fresh from whatever
  the new page's rows are — same reset point as `selectedRequests` being
  cleared on page/limit change, just handled one call site later since it
  depends on knowing the new row ids. **Pre-filled from the fetched
  request's own existing rating** (`request.Shop_Rating`/
  `request.Maintenance_Agent_Rating`, `String(...)`-coerced), not blanked
  unconditionally — a request already rated in an earlier call shows that
  rating instead of looking unrated. This depends on `ratingOptions` using
  **string** values (`'1'`-`'5'`, fixed 2026-08-21) — `Shop_Rating`/
  `Maintenance_Agent_Rating` are Zoho picklist fields, which always
  send/return strings, so a numeric `option.value` silently failed to
  match an already-existing rating fetched from the API (fresh
  user-picked values worked fine either way, since a native `<select>`'s
  `$event.target.value` is always a string regardless of the option's JS
  type — this only broke pre-filling, which is why it wasn't caught by
  testing a fresh submission). Each row's `<select required>` is
  conditionally required only when that row is checked
  (`selectedRequests.includes(request.id)`) — required on every row
  regardless of selection would block submitting the form at all for rows
  the agent never intended to rate.

- **ActiveClientFeedbackForm** — `hasConcerns === 'Yes'` gates the Primary
  Concern select. Critically, **`concernBranch` (which drives
  `ReasonBranchFields`) also has to check `hasConcerns`, not just
  `primaryConcern`** — this was an actual bug fixed during this project:
  `primaryConcern` never resets on its own, so if `concernBranch` only read
  `primaryConcern`, backing out from Yes → picked a concern → back to No
  left the concern's sub-fields rendered (and their stale answers still
  flowing into the payload) even though `Primary_Concern` correctly reset
  to `''`. If you ever add another gate like this (an outer yes/no wrapping
  a reason-driven sub-tree), make the branch computed depend on _both_
  the gate and the reason, not just the reason.

- **ReEngagementForm** — two independent gates stacked: `reasonStopped`
  drives `reasonBranch` (→ `ReasonBranchFields`) the normal way, and
  separately `isClosingReEngagement === 'Yes'` gates the entire Outcome
  section as one block (the whole nested template, not per-field), so
  there's no equivalent risk to the Active Client bug above — flipping it
  back to 'No' hides everything downstream in one shot. Every
  outcome-dependent payload field reads the _guarded_ `resolvedOutcome`
  variable (`isClosingReEngagement === 'Yes' ? reEngagementOutcome.value :
''`), never the raw ref — that's what makes the guard actually safe.
  `opensChurnedForm` (`!!CHURN_REASON_BY_OUTCOME[outcome]`) is a third,
  derived gate that hides the Next Action Date field and changes what
  submit does entirely — see the handoff section. A `Next_Review_Date`
  field (shown/required specifically for the "Not Now" outcome, replacing
  Next Action Date for that one case) was added and then removed again on
  2026-08-21 — product decided Next Action Date should be used
  consistently across every outcome and every form instead of a
  second, outcome-specific date field. If you see either name mentioned in
  older history/artifacts, this is why it's gone.

- **ChurnedFeedbackForm** — reachable two ways (direct pick from Home, or
  handoff from Re-engagement); `consumeHandoffData()` runs once at setup,
  synchronously seeding `churnReason`/`competitorName`/`whyCompetitorWon`'s
  _initial_ ref values before anything renders. `churnReason` drives
  `churnBranch` the same way the other two forms do. `returnPossibility`
  gates `showWhatCouldBringBack` — deliberately `['High','Medium','Low'].
includes(...)` rather than `!== 'No Chance'`, so `Unknown` is also
  excluded; the spec never actually says what `Unknown` should do here,
  this was a judgment call, not a documented requirement.

  **2026-08-21 — reconciling the two overlapping "will they come back"
  questions asked across the handoff.** Re-engagement's `Return_Potential`
  and Churned's `Return_Possibility` ask essentially the same thing with
  different value sets; without reconciliation a handed-off record could
  carry two disagreeing answers with nothing to indicate which is
  authoritative. `returnPossibility`'s _initial_ ref value is now also
  seeded from the handoff, through a small `RETURN_POTENTIAL_TO_POSSIBILITY`
  lookup (`High→High, Medium→Medium, Low→Low, No Potential→No Chance,
  Unknown→Unknown`) — same pre-fill-and-editable treatment as
  `churnReason`/`competitorName`. `What_Can_Bring_Client_Back` vs
  `What_Could_Bring_Client_Back` got the lighter treatment instead: no
  pre-fill (the option lists don't map cleanly onto each other — building
  a lossy value-mapping table wasn't worth it for a multi-select), just a
  `previousWhatCanBringBack` context note shown next to the field so the
  agent sees what was said before without it being silently duplicated or
  silently contradicted.

## The shared conditional-field tree: `ReasonBranchFields.vue`

This is the most structurally important file to understand. Three forms —
Active Client Feedback, Re-engagement, and Churned — each have their own
top-level "what's wrong" dropdown (different values in each: `Primary
Concern` / `Why Did Client Stop Using Truck.me?` / `Churn Reason`), but the
_downstream_ conditional fields for equivalent reasons (Price, Bad Service
Experience, Location/Coverage, Service Availability, Billing, Driver,
Communication, the competitor-related branches, etc.) used to be
copy-pasted three times. They're now defined once in
`ReasonBranchFields.vue` and mounted by all three forms.

**How a parent wires it up:**

```js
// 1. Map this form's own reason values onto the shared branch keys
const REASON_TO_BRANCH = { Price: 'price', 'Bad Service Experience': 'badService', ... }
const activeBranch = computed(() => REASON_TO_BRANCH[reason.value] || '')

// 2. Mount it
<ReasonBranchFields :branch="activeBranch" v-model:competitor-name="competitorName"
  v-model:why-competitor-won="whyCompetitorWon" ref="branchRef" />

// 3. At submit time, spread its output into your own apiData
const branchFields = branchRef.value?.getApiFields() || {}
const apiData = { ...myOwnFields, ...branchFields }
```

`getApiFields()` always returns the _full_ set of possible keys, blanked to
`''`/`[]` for whatever branch isn't active — callers never need their own
per-field ternaries for anything that lives inside the shared tree.

`competitorName` / `whyCompetitorWon` are the two fields **lifted out** of
the child (via `defineModel`) rather than owned internally, because they
need to be read or seeded from outside: Re-engagement reuses
`competitorName` for its own separate "Lost To Competitor" _outcome_
section (not part of the shared tree), and Churned pre-fills both from a
Re-engagement handoff.

Two override props remain, both for the `communication` branch:
`communicationOptions` (which list to show — `CommunicationIssueOptions`
for Active Client Feedback vs. the default `ReEngagementCommunicationOptions`)
and `communicationFieldKey` (which Zoho field to write the answer to —
`'Communication_Issue'` for Active Client Feedback vs. the default
`'Communication_Trust_Issue'`). Both exist because this is genuinely a
different question depending on the form (support-responsiveness focus vs.
trust focus), not just different wording — so rather than force one Zoho
field to hold a blended value list from two different questions, the
branch writes to two separate fields, selected via `getApiFields()`'s one
computed object key: `[props.communicationFieldKey]: ...`. Everything else
Active Client Feedback uses from this tree is identical to
Re-engagement/Churned's version, including the option lists and field
names — there used to be an analogous override for Related Service,
removed once _that_ pair of lists turned out to be genuinely the same
thing (see git history around `ServiceCatalogOptions`/
`ServicesDiscussedOptions` if you need the story). Communication went the
opposite direction: it started shared, then got split back apart once it
was clear the content — not just the wording — actually differs.

**If you touch this file:** remember it's rendering three different reason
taxonomies through one set of branch keys (`price`, `competitorChoice`,
`lostToCompetitor`, `noNeed`, `internalMaintenance`, `badService`,
`location`, `serviceAvailability`, `billing`, `communication`, `driver`,
`company`). A branch key typo in any consuming form's lookup object fails
_silently_ — the branch just never activates, no console error — so if a
reason's fields mysteriously never show up, check the parent's `REASON_TO_
BRANCH`-style map for an exact string mismatch against the actual option
list value first.

## The Re-engagement → Churned handoff

This is the one place the app does something beyond "fill a form, create a
record." Three Re-engagement outcomes end the re-engagement effort as a
loss: `Lost To Competitor`, `Hard Refusal`, `Out Of Business`. Per the
product spec, all three should result in the client becoming Churned and a
Churn form opening.

Since this widget has no access to (and was explicitly told not to touch)
Zoho funnel-stage fields, the practical implementation is: **Re-engagement
routes straight into the Churned form instead of closing**, carrying
forward whatever's already known via `src/store/handoff.js` — a one-shot
`setHandoffData()`/`consumeHandoffData()` pair (module-level ref, not a
composable-per-call pattern like `useUserStore`, because the source form is
unmounted the instant it navigates away).

Two consequences worth knowing:

1. **Re-engagement does not create its own touchpoint when this happens.**
   All the fields it collected get bundled into the handoff and merged into
   the Churned form's _single_ final `createTouchpoint` call
   (`ChurnedFeedbackForm.vue` spreads `...incomingHandoff.reEngagementFields`
   _before_ its own fields, so its own answers always win on any
   overlapping key like `Next_Action_Date`). One call, one touchpoint,
   holding both the re-engagement history and the churn intake.
2. `Out Of Business` → Churned's `Business Closed` reason is a **judgment
   call**, not something the spec states explicitly — the spec just says
   "open the Churn Form" for that outcome. If product wants the agent to
   pick the Churn Reason fresh instead of it being pre-selected, that's a
   one-line change in `ReEngagementForm.vue`'s `CHURN_REASON_BY_OUTCOME`.

## Known gaps (deliberately out of scope, not overlooked)

These came up explicitly when the Re-engagement/Churned/Active Client
blocks were built against a formal spec doc (see
`local/Sales - rengagment_churn_active.docx` — gitignored, ask whoever has
it if it's not on your machine). A full field-by-field audit against that
doc exists as a Claude artifact from this project's history; ask the
previous developer/AI session for the link if you need the full writeup.
See also [`ZOHO_AUTOMATION_PLAN.md`](./ZOHO_AUTOMATION_PLAN.md) for the
Zoho-side design (not yet built) that addresses the first two gaps below.
Short version of what's _not_ built:

- **No funnel-stage automation anywhere in this widget.** Dormant→Re-engagement,
  Re-engagement→Dormant/Churned, the "Reactivated requires a real Service
  Used, not just interest" gate — none of it happens in `src/`. This is
  still the right split: the widget's job is data capture, Zoho-side
  workflows/blueprints/schedules own stage transitions. Don't add
  `ZOHO.CRM.API.updateRecord` calls for stage fields here without checking
  this split still holds. **A full Zoho-side design for this now exists**
  (`docs/ZOHO_AUTOMATION_PLAN.md`, 2026-08-21) — the stage field is
  `Maintenance_Sales.Lifecycle_Status`, but it's designed only, not yet
  built in Zoho, and none of it touches this widget's code either way.
- **No "Start Re-engagement" trigger in this widget** — still true, and
  still the right split: the only way into the Re-engagement form is
  picking it from `HomeForm`'s plain dropdown (now filtered by
  `Lifecycle_Status`, see `availableConversationTypes` below, but nothing
  hard-blocks picking it regardless), there's no Dormant-awareness or
  system-created task inside `src/`. **Resolved Zoho-side as of 2026-08-21**
  per `docs/ZOHO_AUTOMATION_PLAN.md`: creating a Re-engagement touchpoint is
  now the actual trigger — a live Field Update workflow action sets
  `Lifecycle_Status = 'Re-engagement'` on the related `Maintenance_Sales`,
  since product confirmed this form is only ever opened on a Dormant
  client. No widget change was needed or made.
- **No Active Client feedback cadence.** The spec calls for
  `Last`/`Next Client Feedback Date` tracked per Account, scheduled by
  fleet size, so the same client isn't re-surveyed on every service case.
  None of that exists — `ActiveClientFeedbackForm` can be opened for the
  same Account as often as anyone wants, and nothing records when it was
  last used.

## Known bugs / rough edges (not deliberate)

- **`PostServiceFeedbackForm.vue`'s `submitPostServiceFeedback()` has no
  `.finally()` around its main async chain.** If `createTouchpoint`, the
  `getRecord` call, or the `Promise.all(updateMaintenanceRequests(...))`
  call throws, `isLoading` never resets to `false` — the Submit button
  stays disabled and the user is stuck with no feedback. It also does an
  unused `ZOHO.CRM.API.getRecord` call right after creating the touchpoint,
  purely to `console.log` it — dead code, safe to remove.
- **No per-record status checking anywhere** (mentioned above, worth
  repeating here since it's the single most impactful thing to fix if
  you're looking for a place to start).
- **`updateMaintenanceRequests` fires one `updateRecord` call per selected
  request** rather than a single bulk call — fine at the current pagination
  cap (50 rows) but worth knowing if that cap ever changes.
- Entity name inconsistency that is **intentional, not a bug**: touchpoints
  are created against `Maintenance_Touchpoints` (plural) but
  `updateMaintenanceRequests` targets `Maintenance_Request` (singular) — the
  singular form was a deliberate correction to match the real module API
  name in Zoho. Don't "fix" this to match the plural convention.
- **`PostServiceFeedbackForm`'s request-table key** (`request.id ||
  JSON.stringify(request)`) implies `request.id` can sometimes be missing.
  If it ever is, the row's checkbox pushes `undefined` into
  `selectedRequests`, and the resulting `updateRecord` call fails silently
  per-record (compounds with the no-status-check gap above). Confirm
  `msGetMaintenanceRequests` always returns an `id`, or filter rows without
  one out of selectability.
- **`HomeForm`'s `fetchMaintenanceOffer()` has no `.catch`** — same
  fire-and-forget pattern as `fetchUser()` everywhere else. Harmless today
  (`availableConversationTypes` already degrades gracefully) but an
  unhandled rejection on failure is avoidable noise.
- **`Owner` can end up blank on any form**, not just theoretically: every
  form reads `user.value?.id || ''` at submit time from a `fetchUser()`
  fired at setup with nothing blocking Submit until it resolves. Submit
  fast enough (or on a slow connection) and `Owner: ''` goes through
  silently. Applies identically across all six forms — fixing it means
  disabling Submit (or the whole form) until `user.value` is populated.
- **Leftover dead debug comment** in `PostServiceFeedbackForm.vue`:
  `<!-- <pre>{{ JSON.stringify(reqData, null, 2) }}</pre> -->`. Harmless,
  safe to delete.

### Business-logic gaps (not code bugs — the code does what it's told, the rules just don't cross-check each other)

Found via a deliberate review pass (2026-08-21), not yet acted on beyond
one fix (see the Re-engagement→Churned handoff section above for the
`Return_Potential`/`Return_Possibility` reconciliation that _was_ made):

- **`ReEngagementForm`'s `Re_Engagement_Status` can drift from the actual
  outcome.** It's a free-standing manual field with no link to
  `isClosingReEngagement`/`Re_Engagement_Outcome` — nothing stops
  submitting `Re_Engagement_Status: 'New'` alongside outcome `Reactivated`,
  or `'Ready To Close'` while `isClosingReEngagement: 'No'`. Two
  independent trackers of process state that can silently disagree.
- **`ActiveClientFeedbackForm` has no cross-check between sentiment
  fields.** `Overall_Experience: 'Very Unsatisfied'` + `Has_Concerns: 'No'`
  is a direct, unvalidated contradiction. `What_Can_We_Improve` also stays
  fillable regardless of `Has_Concerns`.
- **`PostServiceFeedbackForm` has no detail branch for negative feedback.**
  Every other "something went wrong" path in this app (Active Client's,
  Re-engagement's, and Churned's Bad Service Experience) opens a rich
  branch — what went wrong, which service, shop, severity.
  Post-Service Feedback has nothing: if `Service_Satisfaction: Bad`,
  nothing captures why. Asymmetric with how every other negative signal in
  the app is handled.

## Testing checklist when you touch a form

Since nothing here can be tested locally against real Zoho data, before
shipping a change:

1. `npm run build` — confirms it at least compiles and packages.
2. `npx eslint <changed files>` — the codebase has a permanent baseline of
   `'ZOHO' is not defined` (`no-undef`) warnings on every file that calls
   `ZOHO.CRM.*`, since there's no global type/lint config for it. That's
   expected noise, not a regression — look for _new_ errors beyond that
   baseline, and for any `no-unused-vars`.
3. If you touched `ReasonBranchFields.vue` or any of the three forms that
   mount it, cross-check the consuming form's branch-key lookup object
   against the actual current values in the relevant `select-options.js`
   export — a rename on one side without the other fails silently (see
   above).
4. Update [`AGENT_GUIDE.md`](./AGENT_GUIDE.md) in the same change if the
   fields, options, or flow an agent sees actually changed — it's meant to
   stay accurate to current behavior, not just to when it was written.

## Where the option lists live

`src/config/select-options.js` is organized into commented sections by
consumer, not alphabetically — read the section headers before adding a
new list, since there's a good chance a "new" field is actually a
near-duplicate of something already there. The file's top comment explains
which near-duplicate "families" are intentional (different specs genuinely
wanted different values) versus which have already been merged. If you're
about to copy-paste an existing list to tweak one value, stop and check
whether it should instead be `[...ExistingList, { extra options }]` the way
`TargetServiceOptions`/`LostServicesOptions` extend `ServicesDiscussedOptions`.

## Field reference — every field name this widget writes

Extracted directly from each form's submit function, not from
`select-options.js` (that file lists dropdown _values_, this lists the
Zoho field API _names_ each form actually sends). As of 2026-08-20 every
field name below is confirmed against a real Zoho layout export, not just
inferred from a label — see the note under "How a submission actually
works" above for the 2 known picklist-value exceptions.

**Common to every form's touchpoint** (`Maintenance_Touchpoints`):

| Field                | Notes                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Maintenance_Offers` | lookup, from the widget's `entityId`                                                                                                                                                                                                                                                                                                                                                                 |
| `Conversation_Type`  | matches a `ConversationTypes` value                                                                                                                                                                                                                                                                                                                                                                  |
| `Call_Outcome`       | matches a `CallOutcomeOptions` value                                                                                                                                                                                                                                                                                                                                                                 |
| `Next_Action_Date`   | date                                                                                                                                                                                                                                                                                                                                                                                                 |
| `Owner`              | `user.value?.id \|\| ''` — a plain ID string, not `{id: ...}`. It's an `ownerlookup` field (confirmed via layout export), a distinct type from the plain `lookup` type `Maintenance_Offers` uses — confirmed as of 2026-08-20 that the same bare-string shape works correctly for `Owner` too. Sent by every form, including `ActiveClientFeedbackForm` (the one form that used to skip it — fixed). |

**Shared branch-tree fields** — sent by `ActiveClientFeedbackForm`,
`ReEngagementForm`, and `ChurnedFeedbackForm` (via `ReasonBranchFields.
vue`'s `getApiFields()`), always all 19, blanked to `''`/`[]` for whichever
reason branch isn't currently active:

| Field                | Field                    | Field                         | Field                          |
| -------------------- | ------------------------ | ----------------------------- | ------------------------------ |
| `Price_Issue`        | `Competitor_Name`        | `Estimated_Price_Difference`  | `Competitor_Choice_Reason`     |
| `Why_Competitor_Won` | `No_Current_Need_Reason` | `Internal_Maintenance_Method` | `Service_Issue`                |
| `Related_Service`    | `Shop_Name`              | `Issue_Severity`              | `Location_Problem`             |
| `Needed_State`       | `Needed_City`            | `Suggested_Shop`              | `Service_Availability_Problem` |
| `Billing_Issue`      | `Driver_Issue`           | `Company_Change`              |                                |

Plus a 20th field whose _name_ depends on the caller (see the
`communicationFieldKey` prop above): `ActiveClientFeedbackForm` writes
this branch's answer to `Communication_Issue`; `ReEngagementForm` and
`ChurnedFeedbackForm` write it to `Communication_Trust_Issue`. Two
separate Zoho fields, two separate option lists — not a naming quirk,
the underlying question is genuinely different between the two.

**IntroForm** adds: `Client_Reaction`, `Refusal_Reason`,
`Refusal_Confidence`, `Services_Discussed` (multi-select), `Summary_Notes`.

**PostServiceFeedbackForm** is the exception — its touchpoint carries
_only_ the common 5 fields above, nothing else. The satisfaction/rating
answers go on the **`Maintenance_Request`** module instead (one
`updateRecord` call per selected row):

| Field                      | Notes                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `Service_Satisfaction`     | same value on every selected row — one overall answer for the whole call                       |
| `Will_Use_Again`           | same value on every selected row — one overall answer for the whole call                       |
| `Shop_Rating`              | **per row** (2026-08-21) — `shopRatings.value[id]`, can differ per selected request             |
| `Maintenance_Agent_Rating` | **per row** (2026-08-21) — `agentRatings.value[id]`, can differ per selected request             |
| `Touchpoint`               | lookup, sent as `{ id: <new touchpoint's id> }` — same on every row                             |

**ActiveClientFeedbackForm** adds (beyond the common fields, including
`Owner` — see above — and the 19 shared branch fields plus its own
`Communication_Issue`): `Overall_Experience`, `Client_Likes` (multi-select),
`Main_Reason`, `What_Can_We_Improve` (multi-select), `Has_Concerns`,
`Primary_Concern`.

**ReEngagementForm** adds (beyond the common fields and the 19 shared
branch fields plus its own `Communication_Trust_Issue` — note
`Competitor_Name`/`Why_Competitor_Won` here can come from either the
reason branch or the outcome section, see the flow section above):
`Reason_Stopped`, `What_Can_Bring_Client_Back` (multi-select),
`Target_Service` (multi-select), `Return_Potential`, `Re_Engagement_Status`,
`Re_Engagement_Outcome`, `What_Brought_Client_Back` (multi-select),
`Why_Not_Now`, `Contactability`.

**ChurnedFeedbackForm** adds (beyond the common fields and the 19 shared
branch fields plus its own `Communication_Trust_Issue`): `Churn_Reason`,
`Lost_Services` (multi-select), `Return_Possibility`,
`What_Could_Bring_Client_Back` (multi-select). When reached via the
Re-engagement handoff, the same touchpoint _also_ carries every field
Re-engagement collected (its own answers win on any overlapping key) — so
a handed-off Churned touchpoint can legitimately contain `Reason_Stopped`,
`Re_Engagement_Status`, etc. alongside `Churn_Reason`. That's intentional,
not a leak — see the handoff section.

**Total surface**: 5 common + 19 shared branch + 2 communication fields
(`Communication_Issue` and `Communication_Trust_Issue`, one per differing
form) + 5 (Intro) + 6 (Active Client) + 9 (Re-engagement) + 4 (Churned) =
**50 distinct field names on `Maintenance_Touchpoints`**, plus **5 on
`Maintenance_Request`**.
