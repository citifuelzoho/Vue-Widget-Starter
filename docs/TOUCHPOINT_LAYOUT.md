# Maintenance Touchpoints — Page Layout Reference

> A field-by-field spec for the `Maintenance_Touchpoints` module's page
> layout in Zoho CRM: sections, fields, types, and the exact option values
> each dropdown/multi-select needs. Pulled directly from
> `src/config/select-options.js` and each form's submit function — see
> [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) for how these get populated.
>
> **Confirmed against the real layout as of 2026-08-20** (a Zoho layout
> export was pulled and diffed field-by-field against this doc and the code):
> the layout already exists in Zoho with these exact 8 sections, and every
> checked picklist/multi-select field matches the code's option lists
> **exactly**, value-for-value, in order. Two mismatches found in that pass
> (`Conversation_Type` missing 2 values, `Main_Reason` had a merged value)
> were Zoho-side data issues, not doc/code bugs, and have since been
> **fixed directly in Zoho Setup** — see the resolved-issue notes on
> Section 1 and Section 3 below for what was wrong and how it was found,
> kept for reference in case a similar copy-paste mistake happens again on
> another field.
>
> Suggested Layout Rules: show **Intro Details** only when
> `Conversation_Type = Intro`; show **Active Client Feedback** +
> **Concern / Reason Details** only when `Conversation_Type = Active Client
Feedback`; show **Concern / Reason Details** + **Re-engagement** only when
> `Conversation_Type = Re-engagement`; show **Concern / Reason Details** +
> **Churned** only when `Conversation_Type = Churned Feedback`.

## Section 1 — Call Info

_Always populated, on every touchpoint regardless of conversation type._

| Field                | Type                        | Values                                                                                |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `Maintenance_Offers` | Lookup → Maintenance Offers | —                                                                                     |
| `Conversation_Type`  | Dropdown                    | Intro, Post-service feedback, Active Client Feedback, Re-engagement, Churned Feedback |
| `Call_Outcome`       | Dropdown                    | Connected, No answer, Busy, Wrong number                                              |
| `Owner`              | Lookup → User               | —                                                                                     |
| `Next_Action_Date`   | Date                        | —                                                                                     |

> ✅ **`Conversation_Type` — fixed 2026-08-20.** The live picklist was
> missing `Active Client Feedback` and `Churned Feedback` (confirmed via a
> layout export); both have since been added in Zoho Setup. (`Follow-up`/
> `Promo` exist in Zoho but aren't offered by the widget's dropdown — that's
> fine, intentionally unused.)
>
> ✅ **`Owner` — confirmed working, sent by every form as of 2026-08-20.**
> It's an `ownerlookup`-type field; the widget sends a plain user-ID string
> (`user.id`, same shape as the `Maintenance_Offers` lookup), and this has
> now been confirmed to work correctly. `ActiveClientFeedbackForm` used to
> be the one form that didn't call `useUserStore()`/send `Owner` at all —
> that's fixed, it now sends `Owner` like every other form.

## Section 2 — Intro Details

_Populated only when `Conversation_Type = Intro`._

| Field                | Type            | Values                                                                                                                       |
| -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Client_Reaction`    | Dropdown        | Interested, Neutral, Not now, Refused                                                                                        |
| `Refusal_Reason`     | Dropdown        | Price, No Need, Timing, Competitor, No Trust, Other                                                                          |
| `Refusal_Confidence` | Dropdown        | Hard, Soft                                                                                                                   |
| `Services_Discussed` | Multi-select    | Oil & PM Services, Tire Services, Mechanical Repairs, Inspections, Wash & Cleaning, Parking, Roadside Assistance, Dealership |
| `Summary_Notes`      | Multi-line text | —                                                                                                                            |

## Section 3 — Active Client Feedback

_Populated only when `Conversation_Type = Active Client Feedback`._

| Field                 | Type         | Values                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Overall_Experience`  | Dropdown     | Very Satisfied, Satisfied, Neutral, Unsatisfied, Very Unsatisfied                                                                                                                                                                                                                                                  |
| `Client_Likes`        | Multi-select | Price / Savings, Discounts, Promotions, Convenient Locations, Shop Network, Service Availability, Fast Service, Service Quality, Easy Process, Easy Communication, Sales Support, Customer Support, Billing / Payment, Fuel Program Integration, Driver Convenience, Trust, Relationship With Truck.me Team, Other |
| `Main_Reason`         | Dropdown     | Better Price, Convenience, Locations, Shop Network, Service Quality, Fast Service, Discounts / Promotions, Easy Payment, Fuel Program, Relationship With Team, Trust, Driver Preference, No Better Alternative, Other                                                                                              |
| `What_Can_We_Improve` | Multi-select | Better Price, More Discounts, More Promotions, More Locations, Better Shops, Faster Service, Better Service Quality, Better Communication, Better Billing, More Services, Better Driver Experience, Better Support, Nothing, Other                                                                                 |
| `Has_Concerns`        | Dropdown     | Yes, No                                                                                                                                                                                                                                                                                                            |
| `Primary_Concern`     | Dropdown     | Price, Competitor, Location / Coverage, Service Availability, Bad Service Experience, Billing / Payment, Communication, Driver Related, Other                                                                                                                                                                      |

> ✅ **`Main_Reason` — fixed 2026-08-20.** The live picklist had `Trust`
> and `Driver Preference` merged into one value, `Trust · Driver
Preference`, instead of the two separate values the code sends. Likely
> cause: this table used to join list items with " · " in a single cell,
> and whoever set the picklist up in Zoho Setup copy-pasted a chunk of a
> cell without splitting on the separator (this doc has since switched to
> ", " throughout specifically to prevent that happening again on another
> field). The picklist has since been split back into `Trust` and `Driver
Preference` in Zoho Setup.

## Section 4 — Concern / Reason Details

_Shared by Active Client Feedback, Re-engagement, and Churned — which of
these are populated depends on the reason picked in whichever of those
three drove this touchpoint (`Primary_Concern` / `Reason_Stopped` /
`Churn_Reason`). Grouped below by sub-topic, matching the order the widget
itself reveals them in._

**Price**

| Field                        | Type             | Values                                                                                                                                                                                         |
| ---------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Price_Issue`                | Dropdown         | Price Too High, Competitor Is Cheaper, Wants Additional Discount, Promotion Ended, Does Not See Enough Savings, Unexpected Fees, Final Price Different Than Expected, Budget Limitation, Other |
| `Competitor_Name`            | Single-line text | —                                                                                                                                                                                              |
| `Estimated_Price_Difference` | Dropdown         | Less Than 5%, 5–10%, 11–20%, More Than 20%, Unknown                                                                                                                                            |

**Competitor**

| Field                      | Type     | Values                                                                                                                                                                                                                                                               |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Competitor_Choice_Reason` | Dropdown | Better Price, Better Discounts, Better Locations, Better Coverage, Better Service Quality, Faster Service, Existing Contract, Better Credit Terms, Better Payment Terms, Existing Relationship, Driver Preference, Management Preference, Better Shop Network, Other |
| `Why_Competitor_Won`       | Dropdown | _(same list as `Competitor_Choice_Reason` above — both fields share one option list, `CompetitorReasonOptions`)_                                                                                                                                                     |

**Need / internal maintenance**

| Field                         | Type     | Values                                                                                                                                                                     |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `No_Current_Need_Reason`      | Dropdown | Service Not Due Yet, Low Mileage, Trucks Temporarily Inactive, Low Freight Volume, Seasonal Business, Rarely Needs Service, Will Need Service Later, Unknown Timing, Other |
| `Internal_Maintenance_Method` | Dropdown | Own Shop, Own Mechanics, Oil Change Internally, PM Internally, Tire Service Internally, Buys Parts Directly, Company Policy Requires Internal Maintenance, Other           |

**Service experience**

| Field             | Type             | Values                                                                                                                                                                                                                                 |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Service_Issue`   | Dropdown         | Poor Service Quality, Long Waiting Time, Bad Staff Attitude, Incorrect Repair, Problem Not Resolved, Unexpected Charges, Truck Was Damaged, Poor Communication, Driver Complaint, Shop Complaint, Would Not Return To Same Shop, Other |
| `Related_Service` | Dropdown         | Oil & PM Services, Tire Services, Mechanical Repairs, Inspections, Wash & Cleaning, Parking, Roadside Assistance, Dealership                                                                                                           |
| `Shop_Name`       | Single-line text | —                                                                                                                                                                                                                                      |
| `Issue_Severity`  | Dropdown         | Minor, Medium, Serious, Critical                                                                                                                                                                                                       |

**Location**

| Field              | Type             | Values                                                                                                                                                                                                                                |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Location_Problem` | Dropdown         | No Shop Near Route, No Location In Needed State, No Location In Needed City, Current Locations Are Inconvenient, Preferred Shop Is Not In Network, Driver Cannot Reach Location, Route Changed, Needs More Nationwide Coverage, Other |
| `Needed_State`     | Dropdown         | All 50 US states + District of Columbia                                                                                                                                                                                               |
| `Needed_City`      | Single-line text | —                                                                                                                                                                                                                                     |
| `Suggested_Shop`   | Single-line text | —                                                                                                                                                                                                                                     |

**Availability / billing**

| Field                          | Type     | Values                                                                                                                                                                             |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Service_Availability_Problem` | Dropdown | Service Not Available, Shop Was Full, No Appointment Available, Parts Not Available, Shop Closed, Long Waiting Time, Service Took Too Long, Requested Service Not Supported, Other |
| `Billing_Issue`                | Dropdown | Incorrect Invoice, Incorrect Charge, Unexpected Charge, Payment Method Issue, Credit Issue, Refund Issue, Open Dispute, Payment Terms, Billing Process Too Complicated, Other      |

**Communication / driver / company**

| Field                       | Type     | Values                                                                                                                                                                                                                                               |
| --------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Communication_Trust_Issue` | Dropdown | Does Not Understand Truck.me, Does Not Know Available Services, Was Not Properly Informed, Does Not Trust Truck.me, Does Not Trust Shops, Previous Issue Not Resolved, Poor Communication, No Relationship With Agent, Other                         |
| `Communication_Issue`       | Dropdown | Does Not Understand Truck.me, Does Not Know Available Services, Was Not Properly Informed, Slow Response, Poor Sales Communication, Poor Customer Support, Too Many Calls, Previous Issue Not Resolved, Does Not Know Who To Contact, Other          |
| `Driver_Issue`              | Dropdown | Driver Chooses Own Shop, Driver Prefers Competitor, Driver Does Not Know Truck.me, Driver Does Not Know Available Locations, Driver Refuses To Use Program, Driver Forgot About Program, Driver Had Bad Experience, Drivers Were Not Informed, Other |
| `Company_Change`            | Dropdown | Decision Maker Changed, Owner Does Not Approve, Fleet Manager Does Not Approve, Dispatcher Does Not Use Program, Company Policy Changed, Company Uses Different Vendor, Account Temporarily Suspended, Company Sold, Other                           |

> Note: these are two separate fields, not one field with two names.
> `Communication_Trust_Issue` is written by Re-engagement/Churned's
> "Communication / Trust" branch; `Communication_Issue` is written by
> Active Client Feedback's own "Communication" concern. They used to share
> one field, but the underlying question is genuinely different (trust vs.
> support responsiveness) — see `DEVELOPER_GUIDE.md` for the history. Only
> one of the two is ever populated on a given touchpoint, depending on
> `Conversation_Type`.

## Section 5 — Re-engagement

_Populated only when `Conversation_Type = Re-engagement` (and, once the
handoff fires, also present on the resulting Churned record — see the note
at the end of Section 6)._

| Field                        | Type                             | Values                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Reason_Stopped`             | Dropdown                         | Price, Competitor, No Current Need, Internal Maintenance, Bad Service Experience, Location / Coverage, Service Availability, Billing / Payment, Driver Related, Communication / Trust, Company / Management, Business Slowdown, Fleet Reduced, Unknown, Other                                                                                                                                                                                  |
| `What_Can_Bring_Client_Back` | Multi-select                     | Better Price, Additional Discount, Promotion, Better Shop, New Location, Better Coverage, Resolve Previous Issue, Better Service Quality, Faster Service, Billing Resolution, Better Payment Terms, New Service, Explain Truck.me Again, Inform Drivers, Contact New Decision Maker, Better Communication, Better Support, Sales Follow-up, Fuel Sales Support, Client Needs Service Again, Follow Up Later, Nothing Currently, Unknown, Other |
| `Target_Service`             | Multi-select                     | Oil & PM Services, Tire Services, Mechanical Repairs, Inspections, Wash & Cleaning, Parking, Roadside Assistance, Dealership, Any Service, Other                                                                                                                                                                                                                                                                                               |
| `Return_Potential`           | Dropdown                         | High, Medium, Low, No Potential, Unknown                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Re_Engagement_Status`       | Dropdown                         | New, In Progress, Waiting For Client, Waiting For Truck.me Action, Service Expected, Follow-up Later, Ready To Close                                                                                                                                                                                                                                                                                                                           |
| `Re_Engagement_Outcome`      | Dropdown                         | Reactivated, Still Working, Not Now, Unable To Reach, Lost To Competitor, Hard Refusal, Out Of Business, Other                                                                                                                                                                                                                                                                                                                                 |
| `What_Brought_Client_Back`   | Multi-select                     | Better Price, Discount, Promotion, Better Shop, New Location, Better Coverage, Previous Issue Resolved, Better Service Quality, Faster Service, Billing Issue Resolved, Better Payment Terms, New Service, Better Communication, Better Support, Sales Follow-up, Fuel Sales Support, Client Needed Service Again, Other                                                                                                                       |
| `Why_Not_Now`                | Dropdown                         | Service Not Needed Yet, Low Mileage, Seasonal Business, Trucks Temporarily Inactive, Budget, Waiting For Approval, Waiting For Better Timing, Business Slowdown, Other                                                                                                                                                                                                                                                                         |
| `Contactability`             | Dropdown _(or single-line text)_ | Only ever auto-set to **Unreachable** by the widget when `Re_Engagement_Outcome = Unable To Reach`. Not a field the agent picks from a list — a single-value picklist works, but a plain text field is equally fine.                                                                                                                                                                                                                           |

> `Next_Review_Date` was implemented 2026-08-21 (shown/required for the
> `Not Now` outcome) then removed the same day — decided that
> `Next_Action_Date` should be used consistently across every outcome and
> every form instead of adding a second, outcome-specific date field. If
> this field already exists in Zoho Setup from that brief window, it's
> safe to leave unused or remove; the widget no longer shows or sends it.

## Section 6 — Churned

_Populated only when `Conversation_Type = Churned Feedback`._

| Field                          | Type         | Values                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Churn_Reason`                 | Dropdown     | Price, Lost To Competitor, Bad Service Experience, No Current Need, Internal Maintenance, Location / Coverage, Service Availability, Billing / Payment, Communication / Trust, Driver Related, Company / Management, Fleet Reduced, Business Slowdown, Business Closed, Hard Refusal, Other                                                                |
| `Lost_Services`                | Multi-select | Oil & PM Services, Tire Services, Mechanical Repairs, Inspections, Wash & Cleaning, Parking, Roadside Assistance, Dealership, All Services, Other                                                                                                                                                                                                          |
| `Return_Possibility`           | Dropdown     | High, Medium, Low, No Chance, Unknown                                                                                                                                                                                                                                                                                                                      |
| `What_Could_Bring_Client_Back` | Multi-select | Better Price, Additional Discount, Promotion, Better Shop, New Location, Better Coverage, Resolve Previous Issue, Better Service Quality, Faster Service, Billing Resolution, Better Payment Terms, New Service, Better Communication, Better Support, New Decision Maker, Fuel Sales Support, Relationship Recovery, Business Becomes Active Again, Other |

> When a Churned record was reached via the Re-engagement→Churned handoff
> (outcome = Lost To Competitor, Hard Refusal, or Out Of Business), this
> same record _also_ carries whatever Re-engagement collected —
> `Reason_Stopped`, `Re_Engagement_Status`, etc. from Section 5, plus the
> Section 4 fields for whichever reason Re-engagement was on. That's
> intentional: it's one merged record documenting the whole arc, not a
> data-entry error to clean up.

---

## Layout Rules

> Full field-level Layout Rules for Zoho Setup (Setup → Customization →
> Modules → Maintenance Touchpoints → Layout Rules). Each rule triggers on
> one field's value and shows/hides other fields — rules stack, since a
> given record only ever has one of `Primary_Concern` / `Reason_Stopped` /
> `Churn_Reason` populated depending on `Conversation_Type`. Supersedes the
> one-line "Suggested Layout Rules" note at the top of this doc.

### 1. Section-level — trigger: `Conversation_Type`

| When `Conversation_Type` = | Show                         | Hide                  |
| -------------------------- | ---------------------------- | --------------------- |
| Intro                      | Section 2                    | Section 3, 4, 5, 6    |
| Post-service feedback      | _(nothing beyond Section 1)_ | Section 2, 3, 4, 5, 6 |
| Active Client Feedback     | Section 3                    | Section 2, 5, 6       |
| Re-engagement              | Section 5                    | Section 2, 3, 6       |
| Churned Feedback           | Section 6                    | Section 2, 3          |

⚠️ Do **not** hide Section 5 on Churned Feedback — a record reached via the
Re-engagement→Churned handoff carries populated Section 5 fields merged
onto the same record (see the note at the end of Section 6). Leave it
visible/non-mandatory there. Section 4 is controlled entirely by rule
group 3, not directly by `Conversation_Type`.

### 2. Within-section gates

| Trigger           | Condition | Show                                   | Else                            |
| ----------------- | --------- | -------------------------------------- | ------------------------------- |
| `Client_Reaction` | = Refused | `Refusal_Reason`, `Refusal_Confidence` | hide both                       |
| `Has_Concerns`    | = Yes     | `Primary_Concern`                      | hide it + everything in group 3 |

### 3. Concern/Reason Details branch rules — three parallel triggers, shared target fields

**Trigger: `Primary_Concern`** (Active Client Feedback)

| Value                  | Show                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| Price                  | `Price_Issue` (+ nested rule below)                                 |
| Competitor             | `Competitor_Choice_Reason`, `Competitor_Name`                       |
| Location / Coverage    | `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` |
| Service Availability   | `Service_Availability_Problem`                                      |
| Bad Service Experience | `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`   |
| Billing / Payment      | `Billing_Issue`                                                     |
| Communication          | `Communication_Issue`                                               |
| Driver Related         | `Driver_Issue`                                                      |
| Other                  | _(none)_                                                            |

**Trigger: `Reason_Stopped`** (Re-engagement)

| Value                                               | Show                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| Price                                               | `Price_Issue` (+ nested rule)                                       |
| Competitor                                          | `Competitor_Choice_Reason`, `Competitor_Name`                       |
| No Current Need                                     | `No_Current_Need_Reason`                                            |
| Internal Maintenance                                | `Internal_Maintenance_Method`                                       |
| Bad Service Experience                              | `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`   |
| Location / Coverage                                 | `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` |
| Service Availability                                | `Service_Availability_Problem`                                      |
| Billing / Payment                                   | `Billing_Issue`                                                     |
| Driver Related                                      | `Driver_Issue`                                                      |
| Communication / Trust                               | `Communication_Trust_Issue` (**not** `Communication_Issue`)         |
| Company / Management                                | `Company_Change`                                                    |
| Business Slowdown / Fleet Reduced / Unknown / Other | _(none)_                                                            |

**Trigger: `Churn_Reason`** (Churned)

| Value                                                                      | Show                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Price                                                                      | `Price_Issue` (+ nested rule)                                       |
| Lost To Competitor                                                         | `Competitor_Name`, `Why_Competitor_Won`                             |
| Bad Service Experience                                                     | `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`   |
| No Current Need                                                            | `No_Current_Need_Reason`                                            |
| Internal Maintenance                                                       | `Internal_Maintenance_Method`                                       |
| Location / Coverage                                                        | `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` |
| Service Availability                                                       | `Service_Availability_Problem`                                      |
| Billing / Payment                                                          | `Billing_Issue`                                                     |
| Communication / Trust                                                      | `Communication_Trust_Issue`                                         |
| Driver Related                                                             | `Driver_Issue`                                                      |
| Company / Management                                                       | `Company_Change`                                                    |
| Fleet Reduced / Business Slowdown / Business Closed / Hard Refusal / Other | _(none)_                                                            |

**Nested rule — trigger: `Price_Issue`**
= "Competitor Is Cheaper" → show `Competitor_Name`, `Estimated_Price_Difference`; any other value → hide both. Sits on top of the Price branch rule above, since those two fields only appear for that one `Price_Issue` value, not for every Price selection.

### 4. Re-engagement outcome rules — trigger: `Re_Engagement_Outcome`

| Value                                                  | Show                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Reactivated                                            | `What_Brought_Client_Back`                                                                                    |
| Not Now                                                | `Why_Not_Now`                                                                                                 |
| Lost To Competitor                                     | `Competitor_Name`, `Why_Competitor_Won`                                                                       |
| Unable To Reach                                        | _(none — `Contactability` is auto-set by the widget, not agent-picked; consider read-only instead of a rule)_ |
| Still Working / Hard Refusal / Out Of Business / Other | _(none)_                                                                                                      |

There is **no** `Is_Closing_Reengagement` field in Zoho — that gate is
UI-only in the widget and never persisted, so there's nothing to trigger on
natively.

### 5. `Return_Possibility` rule (Churned) — trigger: `Return_Possibility`

= High / Medium / Low → show `What_Could_Bring_Client_Back`. = No Chance / Unknown → hide it.

### Known limitation

Zoho Layout Rules trigger on **one field at a time** — there's no native
"`Has_Concerns`=Yes AND `Primary_Concern`=Price" compound condition.
Chaining the two independent rules in groups 2 and 3 reproduces the
widget's behavior for any record created _through_ the widget, since it
always sets both together. The only edge case is someone manually editing
a record directly in Zoho and setting `Primary_Concern` without first
setting `Has_Concerns=Yes` — the branch fields would show anyway. Not
worth building around.

---

## Not part of this layout: Post-Service Feedback

Post-Service Feedback touchpoints carry _only_ Section 1's five fields —
nothing else lands on `Maintenance_Touchpoints` for that flow. The actual
satisfaction/rating answers go on the **`Maintenance_Request`** module
instead, via a separate bulk update, one per request the agent selected:

| Field (on `Maintenance_Request`) | Type                             | Values                                  |
| -------------------------------- | -------------------------------- | --------------------------------------- |
| `Service_Satisfaction`           | Dropdown                         | Good, Neutral, Bad                      |
| `Will_Use_Again`                 | Dropdown                         | Yes, Maybe, No                          |
| `Shop_Rating`                    | Dropdown/Number                  | 1, 2, 3, 4, 5                           |
| `Maintenance_Agent_Rating`       | Dropdown/Number                  | 1, 2, 3, 4, 5                           |
| `Touchpoint`                     | Lookup → Maintenance Touchpoints | sent as `{ id: <new touchpoint's id> }` |

If you're laying out `Maintenance_Touchpoints` specifically, these five
don't belong on it — they need their own section on `Maintenance_Request`'s
layout instead.
