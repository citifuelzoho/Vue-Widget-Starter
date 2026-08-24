# Maintenance Touchpoints — Layout Rules Trigger List

> Flat quick-reference for configuring Zoho Layout Rules field-by-field:
> one entry per trigger field, every value, and the exact fields that
> show/hide. Companion to the full walkthrough and rule tables in
> [`TOUCHPOINT_LAYOUT.md`](./TOUCHPOINT_LAYOUT.md#layout-rules) — that file
> has the section-level rules, build order, and known limitations; this
> file is just the condensed trigger → show/hide list for quick lookup
> while configuring rules in Zoho Setup.

### Trigger: `Has_Concerns`

- **Yes** → Show: `Primary_Concern`
- **No** → Hide: `Primary_Concern`

### Trigger: `Client_Reaction`

- **Refused** → Show: `Refusal_Reason`, `Refusal_Confidence`
- **Interested / Neutral / Not now** → Hide: `Refusal_Reason`, `Refusal_Confidence`

### Trigger: `Primary_Concern`

_(full field set this trigger controls: `Price_Issue`, `Competitor_Choice_Reason`, `Competitor_Name`, `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop`, `Service_Availability_Problem`, `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`, `Billing_Issue`, `Communication_Issue`, `Driver_Issue`)_

- **Price** → Show: `Price_Issue` — Hide: everything else in the set above
- **Competitor** → Show: `Competitor_Choice_Reason`, `Competitor_Name` — Hide: rest
- **Location / Coverage** → Show: `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` — Hide: rest
- **Service Availability** → Show: `Service_Availability_Problem` — Hide: rest
- **Bad Service Experience** → Show: `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity` — Hide: rest
- **Billing / Payment** → Show: `Billing_Issue` — Hide: rest
- **Communication** → Show: `Communication_Issue` — Hide: rest
- **Driver Related** → Show: `Driver_Issue` — Hide: rest
- **Other** → Hide: all fields in the set

### Trigger: `Reason_Stopped`

_(full set: `Price_Issue`, `Competitor_Choice_Reason`, `Competitor_Name`, `No_Current_Need_Reason`, `Internal_Maintenance_Method`, `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`, `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop`, `Service_Availability_Problem`, `Billing_Issue`, `Driver_Issue`, `Communication_Trust_Issue`, `Company_Change`)_

- **Price** → Show: `Price_Issue` — Hide: rest
- **Competitor** → Show: `Competitor_Choice_Reason`, `Competitor_Name` — Hide: rest
- **No Current Need** → Show: `No_Current_Need_Reason` — Hide: rest
- **Internal Maintenance** → Show: `Internal_Maintenance_Method` — Hide: rest
- **Bad Service Experience** → Show: `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity` — Hide: rest
- **Location / Coverage** → Show: `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` — Hide: rest
- **Service Availability** → Show: `Service_Availability_Problem` — Hide: rest
- **Billing / Payment** → Show: `Billing_Issue` — Hide: rest
- **Driver Related** → Show: `Driver_Issue` — Hide: rest
- **Communication / Trust** → Show: `Communication_Trust_Issue` — Hide: rest
- **Company / Management** → Show: `Company_Change` — Hide: rest
- **Business Slowdown / Fleet Reduced / Unknown / Other** → Hide: all fields in the set

### Trigger: `Churn_Reason`

_(full set: `Price_Issue`, `Competitor_Name`, `Why_Competitor_Won`, `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity`, `No_Current_Need_Reason`, `Internal_Maintenance_Method`, `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop`, `Service_Availability_Problem`, `Billing_Issue`, `Communication_Trust_Issue`, `Driver_Issue`, `Company_Change`)_

- **Price** → Show: `Price_Issue` — Hide: rest
- **Lost To Competitor** → Show: `Competitor_Name`, `Why_Competitor_Won` — Hide: rest
- **Bad Service Experience** → Show: `Service_Issue`, `Related_Service`, `Shop_Name`, `Issue_Severity` — Hide: rest
- **No Current Need** → Show: `No_Current_Need_Reason` — Hide: rest
- **Internal Maintenance** → Show: `Internal_Maintenance_Method` — Hide: rest
- **Location / Coverage** → Show: `Location_Problem`, `Needed_State`, `Needed_City`, `Suggested_Shop` — Hide: rest
- **Service Availability** → Show: `Service_Availability_Problem` — Hide: rest
- **Billing / Payment** → Show: `Billing_Issue` — Hide: rest
- **Communication / Trust** → Show: `Communication_Trust_Issue` — Hide: rest
- **Driver Related** → Show: `Driver_Issue` — Hide: rest
- **Company / Management** → Show: `Company_Change` — Hide: rest
- **Fleet Reduced / Business Slowdown / Business Closed / Hard Refusal / Other** → Hide: all fields in the set

### Trigger: `Price_Issue` (nested — only relevant once `Price_Issue` is itself visible)

- **Competitor Is Cheaper** → Show: `Competitor_Name`, `Estimated_Price_Difference`
- **any other value** → Hide: `Competitor_Name`, `Estimated_Price_Difference`

### Trigger: `Re_Engagement_Outcome`

- **Reactivated** → Show: `What_Brought_Client_Back` — Hide: `Why_Not_Now`, `Competitor_Name`, `Why_Competitor_Won`
- **Not Now** → Show: `Why_Not_Now` — Hide: `What_Brought_Client_Back`, `Competitor_Name`, `Why_Competitor_Won`
- **Lost To Competitor** → Show: `Competitor_Name`, `Why_Competitor_Won` — Hide: `What_Brought_Client_Back`, `Why_Not_Now`
- **Still Working / Unable To Reach / Hard Refusal / Out Of Business / Other** → Hide: `What_Brought_Client_Back`, `Why_Not_Now`, `Competitor_Name`, `Why_Competitor_Won`

### Trigger: `Return_Possibility`

- **High / Medium / Low** → Show: `What_Could_Bring_Client_Back`
- **No Chance / Unknown** → Hide: `What_Could_Bring_Client_Back`
