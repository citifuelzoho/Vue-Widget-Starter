// Dropdown/multi-select option lists for the widget's forms, grouped below
// by which form(s) actually consume them (confirmed by usage, not by name).
//
// Some lists that look like they should be one list are kept as deliberate
// siblings instead, because each was given a genuinely different value set
// by its own form's spec (e.g. "what could win the client back" differs by
// stage — ongoing Re-engagement vs. its own Reactivated outcome vs.
// Churned). Those are grouped next to each other with a note explaining the
// difference, so it's clear it's intentional rather than something that was
// missed. Where the drift between near-identical lists turned out to be
// accidental instead — same concept, no real reason for two copies to
// exist — they've been consolidated into one shared list: see YesNoOptions,
// CompetitorReasonOptions, and the ServicesDiscussedOptions-derived service
// lists below.

// ---------------------------------------------------------------------------
// Home form (src/components/forms/HomeForm.vue)
// ---------------------------------------------------------------------------

export const ConversationTypes = [
  { label: 'Intro', value: 'Intro' },
  { label: 'Post-service feedback', value: 'Post-service feedback' },
  // { label: 'Follow-up', value: 'Follow-up' },
  // { label: 'Promo', value: 'Promo' },
  { label: 'Active Client Feedback', value: 'Active Client Feedback' },
  { label: 'Re-engagement', value: 'Re-engagement' },
  { label: 'Churned Feedback', value: 'Churned Feedback' }
]

// DRAFT — first pass, not yet product-confirmed (see docs/ZOHO_AUTOMATION_PLAN.md).
// Which Conversation_Type values HomeForm should offer, filtered by the current
// Maintenance_Sales.Lifecycle_Status (fetched via useMaintenanceOfferStore).
// Falls back to showing every ConversationTypes value while the record hasn't
// loaded yet, or if a stage isn't listed here at all (see HomeForm.vue).
// 'Re-engagement' is deliberately offered from Churned too, not just Dormant —
// spec allows a human to manually restart it from Churned. Decided 2026-08-21,
// pending a future review with the user's manager — revisit if that changes.
export const AllowedConversationTypesByLifecycleStatus = {
  Onboarded: [
    'Intro',
    'Post-service feedback',
    'Active Client Feedback',
    'Re-engagement',
    'Churned Feedback'
  ],
  Educated: [
    'Intro',
    'Post-service feedback',
    'Active Client Feedback',
    'Re-engagement',
    'Churned Feedback'
  ],
  Activated: [
    'Intro',
    'Post-service feedback',
    'Active Client Feedback',
    'Re-engagement',
    'Churned Feedback'
  ],
  Active: [
    'Intro',
    'Post-service feedback',
    'Active Client Feedback',
    'Re-engagement',
    'Churned Feedback'
  ],
  Dormant: ['Re-engagement', 'Churned Feedback'],
  'Re-engagement': ['Re-engagement', 'Churned Feedback'],
  Churned: ['Re-engagement']
}

export const CallOutcomeOptions = [
  { label: 'Connected', value: 'Connected' },
  { label: 'No answer', value: 'No answer' },
  { label: 'Busy', value: 'Busy' },
  { label: 'Wrong number', value: 'Wrong number' }
]

// ---------------------------------------------------------------------------
// Shared across multiple forms
// ---------------------------------------------------------------------------

// Used by both IntroForm (Services Discussed) and ActiveClientFeedbackForm
// (Related Service, under Bad Service Experience).
export const ServicesDiscussedOptions = [
  { label: 'Oil & PM Services', value: 'Oil & PM Services' },
  { label: 'Tire Services', value: 'Tire Services' },
  { label: 'Mechanical Repairs', value: 'Mechanical Repairs' },
  { label: 'Inspections', value: 'Inspections' },
  { label: 'Wash & Cleaning', value: 'Wash & Cleaning' },
  { label: 'Parking', value: 'Parking' },
  { label: 'Roadside Assistance', value: 'Roadside Assistance' },
  { label: 'Dealership', value: 'Dealership' }
]

// A plain Yes/No list, reused wherever a field is a simple yes-or-no
// question (ActiveClientFeedbackForm's "Does Client Have Any Concerns?",
// ReEngagementForm's "Closing Out This Re-engagement?"). Previously
// duplicated as a second, identically-valued HasConcernsOptions export —
// merged into this one.
export const YesNoOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' }
]

// Used by: the shared branch tree, for "Related Service" under Bad Service
// Experience — the same list Active Client Feedback uses for that same
// field, so it's just an alias rather than a second copy of the service
// catalog.
export const RelatedServiceOptions = ServicesDiscussedOptions

// Used by: Re-engagement's "Target Service" field. Built on our actual
// service catalog (ServicesDiscussedOptions) plus "Any Service" — compare
// LostServicesOptions below, which adds "All Services" instead.
export const TargetServiceOptions = [
  ...ServicesDiscussedOptions,
  { label: 'Any Service', value: 'Any Service' },
  { label: 'Other', value: 'Other' }
]

// Used by: Churned's "Lost Services" field. Built on the same service
// catalog plus "All Services" — compare TargetServiceOptions above, which
// adds "Any Service" instead.
export const LostServicesOptions = [
  ...ServicesDiscussedOptions,
  { label: 'All Services', value: 'All Services' },
  { label: 'Other', value: 'Other' }
]

// "Why did the client go with the competitor" — one list shared by all
// three fields that used to each define their own near-identical version
// (Active Client Feedback's "Why Does Client Prefer Competitor?",
// Re-engagement's "Why Did Client Choose Competitor?", and the shared
// "Why Competitor Won?" branch). The wording drift between them has been
// reconciled onto whichever phrasing the majority already used —
// "Existing Relationship" over "Long-Term Relationship" — and "Better Shop
// Network" is kept, since two of the three original lists already had it.
export const CompetitorReasonOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'Better Discounts', value: 'Better Discounts' },
  { label: 'Better Locations', value: 'Better Locations' },
  { label: 'Better Coverage', value: 'Better Coverage' },
  { label: 'Better Service Quality', value: 'Better Service Quality' },
  { label: 'Faster Service', value: 'Faster Service' },
  { label: 'Existing Contract', value: 'Existing Contract' },
  { label: 'Better Credit Terms', value: 'Better Credit Terms' },
  { label: 'Better Payment Terms', value: 'Better Payment Terms' },
  { label: 'Existing Relationship', value: 'Existing Relationship' },
  { label: 'Driver Preference', value: 'Driver Preference' },
  { label: 'Management Preference', value: 'Management Preference' },
  { label: 'Better Shop Network', value: 'Better Shop Network' },
  { label: 'Other', value: 'Other' }
]

// ---------------------------------------------------------------------------
// Intro form (src/components/forms/IntroForm.vue)
// ---------------------------------------------------------------------------

export const ClientReactionOptions = [
  { label: 'Interested', value: 'Interested' },
  { label: 'Neutral', value: 'Neutral' },
  { label: 'Not now', value: 'Not now' },
  { label: 'Refused', value: 'Refused' }
]

export const RefusalReasonOptions = [
  { label: 'Price', value: 'Price' },
  { label: 'No Need', value: 'No Need' },
  { label: 'Timing', value: 'Timing' },
  { label: 'Competitor', value: 'Competitor' },
  { label: 'No Trust', value: 'No Trust' },
  { label: 'Other', value: 'Other' }
]

export const RefusalConfidenceOptions = [
  { label: 'Hard', value: 'Hard' },
  { label: 'Soft', value: 'Soft' }
]

// Maintenance Offer (Maintenance_Sales) fields shown/edited in IntroForm's
// two-column account-details section — added 2026-08-21. Field API names
// below (Account_Type, Fleet_Size, Estimated_Monthly_Mileage,
// Informed_about_TruckMe_By_Fuel_Sales, Preferred_Language, Other_Language,
// Preferred_Communication, Main_Decision_Maker, TG_Group_Link) are INFERRED
// from the labels given, not confirmed against a layout export — flag any
// that don't match your actual Zoho field names.
export const AccountTypeOptions = [
  { label: 'Owner Operator', value: 'Owner Operator' },
  { label: 'Fleet Company', value: 'Fleet Company' }
]

// Distinct from the plain Fleet_Size number field — this bracketed field is
// about monthly mileage, not fleet size (renamed 2026-08-25; was originally
// guessed as a second "Fleet Size" field given both were called that at
// first, but the bracket values are actually mileage ranges).
export const EstimatedMonthlyMileageOptions = [
  { label: '<5k', value: '<5k' },
  { label: '5k - 10k', value: '5k - 10k' },
  { label: '10k - 20k', value: '10k - 20k' },
  { label: '20k+', value: '20k+' }
]

export const IntroductionSourceOptions = [
  { label: 'Fuel Sales', value: 'Fuel Sales' },
  { label: 'Truck.me Outbound', value: 'Truck.me Outbound' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Existing Client', value: 'Existing Client' },
  { label: 'Website', value: 'Website' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Other', value: 'Other' }
]

export const InformedByFuelSalesOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: 'Unknown', value: 'Unknown' }
]

export const PreferredLanguageOptions = [
  { label: 'English', value: 'English' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Uzbek', value: 'Uzbek' },
  { label: 'Ukrainian', value: 'Ukrainian' },
  { label: 'Tadjik', value: 'Tadjik' },
  { label: 'Other', value: 'Other' }
]

export const PreferredCommunicationOptions = [
  { label: 'Phone', value: 'Phone' },
  { label: 'Mobile App', value: 'Mobile App' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Email', value: 'Email' },
  { label: 'Telegram', value: 'Telegram' }
]

export const MainDecisionMakerOptions = [
  { label: 'Owner', value: 'Owner' },
  { label: 'Dispatcher', value: 'Dispatcher' },
  { label: 'Fleet Manager', value: 'Fleet Manager' },
  { label: 'Driver', value: 'Driver' },
  { label: 'Operations Manager', value: 'Operations Manager' },
  { label: 'Other', value: 'Other' }
]

// ---------------------------------------------------------------------------
// Post-Service Feedback form (src/components/forms/PostServiceFeedbackForm.vue)
// ---------------------------------------------------------------------------

export const ServiceSatisfactionOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Neutral', value: 'Neutral' },
  { label: 'Bad', value: 'Bad' }
]

export const WillUseAgainOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'Maybe', value: 'Maybe' },
  { label: 'No', value: 'No' }
]

// Values are strings, not numbers — Shop_Rating/Maintenance_Agent_Rating
// are picklist fields in Zoho, so the API sends/returns these as strings
// ("3", not 3). Keeping this list's values numeric caused the per-row
// selects in PostServiceFeedbackForm to fail to pre-fill from an existing
// rating fetched from Zoho (a strict string wouldn't match a numeric
// option.value).
export const ratingOptions = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' }
]

// Rows-per-page choices for the Maintenance Requests table's pagination.
export const RequestLimitOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 }
]

// ---------------------------------------------------------------------------
// Active Client Feedback form (src/components/forms/ActiveClientFeedbackForm.vue)
// ---------------------------------------------------------------------------

export const OverallExperienceOptions = [
  { label: 'Very Satisfied', value: 'Very Satisfied' },
  { label: 'Satisfied', value: 'Satisfied' },
  { label: 'Neutral', value: 'Neutral' },
  { label: 'Unsatisfied', value: 'Unsatisfied' },
  { label: 'Very Unsatisfied', value: 'Very Unsatisfied' }
]

export const ClientLikesOptions = [
  { label: 'Price / Savings', value: 'Price / Savings' },
  { label: 'Discounts', value: 'Discounts' },
  { label: 'Promotions', value: 'Promotions' },
  { label: 'Convenient Locations', value: 'Convenient Locations' },
  { label: 'Shop Network', value: 'Shop Network' },
  { label: 'Service Availability', value: 'Service Availability' },
  { label: 'Fast Service', value: 'Fast Service' },
  { label: 'Service Quality', value: 'Service Quality' },
  { label: 'Easy Process', value: 'Easy Process' },
  { label: 'Easy Communication', value: 'Easy Communication' },
  { label: 'Sales Support', value: 'Sales Support' },
  { label: 'Customer Support', value: 'Customer Support' },
  { label: 'Billing / Payment', value: 'Billing / Payment' },
  { label: 'Fuel Program Integration', value: 'Fuel Program Integration' },
  { label: 'Driver Convenience', value: 'Driver Convenience' },
  { label: 'Trust', value: 'Trust' },
  {
    label: 'Relationship With Truck.me Team',
    value: 'Relationship With Truck.me Team'
  },
  { label: 'Other', value: 'Other' }
]

export const MainReasonOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'Convenience', value: 'Convenience' },
  { label: 'Locations', value: 'Locations' },
  { label: 'Shop Network', value: 'Shop Network' },
  { label: 'Service Quality', value: 'Service Quality' },
  { label: 'Fast Service', value: 'Fast Service' },
  { label: 'Discounts / Promotions', value: 'Discounts / Promotions' },
  { label: 'Easy Payment', value: 'Easy Payment' },
  { label: 'Fuel Program', value: 'Fuel Program' },
  { label: 'Relationship With Team', value: 'Relationship With Team' },
  { label: 'Trust', value: 'Trust' },
  { label: 'Driver Preference', value: 'Driver Preference' },
  { label: 'No Better Alternative', value: 'No Better Alternative' },
  { label: 'Other', value: 'Other' }
]

export const WhatCanImproveOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'More Discounts', value: 'More Discounts' },
  { label: 'More Promotions', value: 'More Promotions' },
  { label: 'More Locations', value: 'More Locations' },
  { label: 'Better Shops', value: 'Better Shops' },
  { label: 'Faster Service', value: 'Faster Service' },
  { label: 'Better Service Quality', value: 'Better Service Quality' },
  { label: 'Better Communication', value: 'Better Communication' },
  { label: 'Better Billing', value: 'Better Billing' },
  { label: 'More Services', value: 'More Services' },
  { label: 'Better Driver Experience', value: 'Better Driver Experience' },
  { label: 'Better Support', value: 'Better Support' },
  { label: 'Nothing', value: 'Nothing' },
  { label: 'Other', value: 'Other' }
]

// The top-level "Primary Concern" dropdown for this form. Looks similar to
// ReasonStoppedOptions/ChurnReasonOptions below (same idea — "what's
// wrong") but is its own independent list with a different value set, since
// an active client can't have reasons that only make sense for someone who
// has already left (e.g. "Business Closed"). Its concern branches ARE
// implemented through the shared ReasonBranchFields component, same as the
// other two forms — see ActiveClientFeedbackForm.vue.
export const PrimaryConcernOptions = [
  { label: 'Price', value: 'Price' },
  { label: 'Competitor', value: 'Competitor' },
  { label: 'Location / Coverage', value: 'Location / Coverage' },
  { label: 'Service Availability', value: 'Service Availability' },
  { label: 'Bad Service Experience', value: 'Bad Service Experience' },
  { label: 'Billing / Payment', value: 'Billing / Payment' },
  { label: 'Communication', value: 'Communication' },
  { label: 'Driver Related', value: 'Driver Related' },
  { label: 'Other', value: 'Other' }
]

// "What's the communication issue" — compare ReEngagementCommunicationOptions
// further down (used by Re-engagement/Churned instead): different focus
// (this one covers response speed/support quality, that one covers trust),
// not a duplicate of each other.
export const CommunicationIssueOptions = [
  {
    label: 'Does Not Understand Truck.me',
    value: 'Does Not Understand Truck.me'
  },
  {
    label: 'Does Not Know Available Services',
    value: 'Does Not Know Available Services'
  },
  { label: 'Was Not Properly Informed', value: 'Was Not Properly Informed' },
  { label: 'Slow Response', value: 'Slow Response' },
  { label: 'Poor Sales Communication', value: 'Poor Sales Communication' },
  { label: 'Poor Customer Support', value: 'Poor Customer Support' },
  { label: 'Too Many Calls', value: 'Too Many Calls' },
  {
    label: 'Previous Issue Not Resolved',
    value: 'Previous Issue Not Resolved'
  },
  {
    label: 'Does Not Know Who To Contact',
    value: 'Does Not Know Who To Contact'
  },
  { label: 'Other', value: 'Other' }
]

// ---------------------------------------------------------------------------
// Shared reason-branch fields
// (src/components/forms/ReasonBranchFields.vue, mounted by ReEngagementForm
// and ChurnedFeedbackForm; several of these are also reused directly by
// ActiveClientFeedbackForm's own — separately implemented — concern
// branches, as noted per list.)
// ---------------------------------------------------------------------------

// Used by: Active Client Feedback (Price concern) and the shared branch
// tree (Price reason/branch).
export const PriceIssueOptions = [
  { label: 'Price Too High', value: 'Price Too High' },
  { label: 'Competitor Is Cheaper', value: 'Competitor Is Cheaper' },
  { label: 'Wants Additional Discount', value: 'Wants Additional Discount' },
  { label: 'Promotion Ended', value: 'Promotion Ended' },
  {
    label: 'Does Not See Enough Savings',
    value: 'Does Not See Enough Savings'
  },
  { label: 'Unexpected Fees', value: 'Unexpected Fees' },
  {
    label: 'Final Price Different Than Expected',
    value: 'Final Price Different Than Expected'
  },
  { label: 'Budget Limitation', value: 'Budget Limitation' },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback and the shared branch tree, both under
// Price → Competitor Is Cheaper.
export const EstimatedPriceDifferenceOptions = [
  { label: 'Less Than 5%', value: 'Less Than 5%' },
  { label: '5–10%', value: '5–10%' },
  { label: '11–20%', value: '11–20%' },
  { label: 'More Than 20%', value: 'More Than 20%' },
  { label: 'Unknown', value: 'Unknown' }
]

// Used by: the shared branch tree only ("No Current Need").
export const NoCurrentNeedOptions = [
  { label: 'Service Not Due Yet', value: 'Service Not Due Yet' },
  { label: 'Low Mileage', value: 'Low Mileage' },
  {
    label: 'Trucks Temporarily Inactive',
    value: 'Trucks Temporarily Inactive'
  },
  { label: 'Low Freight Volume', value: 'Low Freight Volume' },
  { label: 'Seasonal Business', value: 'Seasonal Business' },
  { label: 'Rarely Needs Service', value: 'Rarely Needs Service' },
  { label: 'Will Need Service Later', value: 'Will Need Service Later' },
  { label: 'Unknown Timing', value: 'Unknown Timing' },
  { label: 'Other', value: 'Other' }
]

// Used by: the shared branch tree only ("Internal Maintenance").
export const InternalMaintenanceOptions = [
  { label: 'Own Shop', value: 'Own Shop' },
  { label: 'Own Mechanics', value: 'Own Mechanics' },
  { label: 'Oil Change Internally', value: 'Oil Change Internally' },
  { label: 'PM Internally', value: 'PM Internally' },
  { label: 'Tire Service Internally', value: 'Tire Service Internally' },
  { label: 'Buys Parts Directly', value: 'Buys Parts Directly' },
  {
    label: 'Company Policy Requires Internal Maintenance',
    value: 'Company Policy Requires Internal Maintenance'
  },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback (Bad Service Experience concern) and the
// shared branch tree ("Bad Service Experience" reason).
export const ServiceIssueOptions = [
  { label: 'Poor Service Quality', value: 'Poor Service Quality' },
  { label: 'Long Waiting Time', value: 'Long Waiting Time' },
  { label: 'Bad Staff Attitude', value: 'Bad Staff Attitude' },
  { label: 'Incorrect Repair', value: 'Incorrect Repair' },
  { label: 'Problem Not Resolved', value: 'Problem Not Resolved' },
  { label: 'Unexpected Charges', value: 'Unexpected Charges' },
  { label: 'Truck Was Damaged', value: 'Truck Was Damaged' },
  { label: 'Poor Communication', value: 'Poor Communication' },
  { label: 'Driver Complaint', value: 'Driver Complaint' },
  { label: 'Shop Complaint', value: 'Shop Complaint' },
  {
    label: 'Would Not Return To Same Shop',
    value: 'Would Not Return To Same Shop'
  },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback and the shared branch tree, both for
// Bad Service Experience / "Issue Severity".
export const IssueSeverityOptions = [
  { label: 'Minor', value: 'Minor' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Serious', value: 'Serious' },
  { label: 'Critical', value: 'Critical' }
]

// Used by: Active Client Feedback and the shared branch tree, both for the
// "Location / Coverage" concern/reason.
export const LocationProblemOptions = [
  { label: 'No Shop Near Route', value: 'No Shop Near Route' },
  {
    label: 'No Location In Needed State',
    value: 'No Location In Needed State'
  },
  { label: 'No Location In Needed City', value: 'No Location In Needed City' },
  {
    label: 'Current Locations Are Inconvenient',
    value: 'Current Locations Are Inconvenient'
  },
  {
    label: 'Preferred Shop Is Not In Network',
    value: 'Preferred Shop Is Not In Network'
  },
  {
    label: 'Driver Cannot Reach Location',
    value: 'Driver Cannot Reach Location'
  },
  { label: 'Route Changed', value: 'Route Changed' },
  {
    label: 'Needs More Nationwide Coverage',
    value: 'Needs More Nationwide Coverage'
  },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback and the shared branch tree, both for
// "Needed State" under Location / Coverage.
export const USStateOptions = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming'
].map(state => ({ label: state, value: state }))

// Used by: Active Client Feedback and the shared branch tree, both for the
// "Service Availability" concern/reason.
export const ServiceAvailabilityProblemOptions = [
  { label: 'Service Not Available', value: 'Service Not Available' },
  { label: 'Shop Was Full', value: 'Shop Was Full' },
  { label: 'No Appointment Available', value: 'No Appointment Available' },
  { label: 'Parts Not Available', value: 'Parts Not Available' },
  { label: 'Shop Closed', value: 'Shop Closed' },
  { label: 'Long Waiting Time', value: 'Long Waiting Time' },
  { label: 'Service Took Too Long', value: 'Service Took Too Long' },
  {
    label: 'Requested Service Not Supported',
    value: 'Requested Service Not Supported'
  },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback and the shared branch tree, both for the
// "Billing / Payment" concern/reason.
export const BillingIssueOptions = [
  { label: 'Incorrect Invoice', value: 'Incorrect Invoice' },
  { label: 'Incorrect Charge', value: 'Incorrect Charge' },
  { label: 'Unexpected Charge', value: 'Unexpected Charge' },
  { label: 'Payment Method Issue', value: 'Payment Method Issue' },
  { label: 'Credit Issue', value: 'Credit Issue' },
  { label: 'Refund Issue', value: 'Refund Issue' },
  { label: 'Open Dispute', value: 'Open Dispute' },
  { label: 'Payment Terms', value: 'Payment Terms' },
  {
    label: 'Billing Process Too Complicated',
    value: 'Billing Process Too Complicated'
  },
  { label: 'Other', value: 'Other' }
]

// Used by: the shared branch tree only, for "Communication / Trust". See
// the note on CommunicationIssueOptions above — deliberately distinct from
// Active Client Feedback's own communication list.
export const ReEngagementCommunicationOptions = [
  {
    label: 'Does Not Understand Truck.me',
    value: 'Does Not Understand Truck.me'
  },
  {
    label: 'Does Not Know Available Services',
    value: 'Does Not Know Available Services'
  },
  { label: 'Was Not Properly Informed', value: 'Was Not Properly Informed' },
  { label: 'Does Not Trust Truck.me', value: 'Does Not Trust Truck.me' },
  { label: 'Does Not Trust Shops', value: 'Does Not Trust Shops' },
  {
    label: 'Previous Issue Not Resolved',
    value: 'Previous Issue Not Resolved'
  },
  { label: 'Poor Communication', value: 'Poor Communication' },
  { label: 'No Relationship With Agent', value: 'No Relationship With Agent' },
  { label: 'Other', value: 'Other' }
]

// Used by: Active Client Feedback and the shared branch tree, both for the
// "Driver Related" concern/reason.
export const DriverIssueOptions = [
  { label: 'Driver Chooses Own Shop', value: 'Driver Chooses Own Shop' },
  { label: 'Driver Prefers Competitor', value: 'Driver Prefers Competitor' },
  {
    label: 'Driver Does Not Know Truck.me',
    value: 'Driver Does Not Know Truck.me'
  },
  {
    label: 'Driver Does Not Know Available Locations',
    value: 'Driver Does Not Know Available Locations'
  },
  {
    label: 'Driver Refuses To Use Program',
    value: 'Driver Refuses To Use Program'
  },
  {
    label: 'Driver Forgot About Program',
    value: 'Driver Forgot About Program'
  },
  { label: 'Driver Had Bad Experience', value: 'Driver Had Bad Experience' },
  { label: 'Drivers Were Not Informed', value: 'Drivers Were Not Informed' },
  { label: 'Other', value: 'Other' }
]

// Used by: the shared branch tree only, for "Company / Management".
export const CompanyManagementChangeOptions = [
  { label: 'Decision Maker Changed', value: 'Decision Maker Changed' },
  { label: 'Owner Does Not Approve', value: 'Owner Does Not Approve' },
  {
    label: 'Fleet Manager Does Not Approve',
    value: 'Fleet Manager Does Not Approve'
  },
  {
    label: 'Dispatcher Does Not Use Program',
    value: 'Dispatcher Does Not Use Program'
  },
  { label: 'Company Policy Changed', value: 'Company Policy Changed' },
  {
    label: 'Company Uses Different Vendor',
    value: 'Company Uses Different Vendor'
  },
  {
    label: 'Account Temporarily Suspended',
    value: 'Account Temporarily Suspended'
  },
  { label: 'Company Sold', value: 'Company Sold' },
  { label: 'Other', value: 'Other' }
]

// ---------------------------------------------------------------------------
// Re-engagement form (src/components/forms/ReEngagementForm.vue)
// — fields unique to this form; see the shared section above for the
// reason-branch fields it also uses via ReasonBranchFields.vue.
// ---------------------------------------------------------------------------

export const ReasonStoppedOptions = [
  { label: 'Price', value: 'Price' },
  { label: 'Competitor', value: 'Competitor' },
  { label: 'No Current Need', value: 'No Current Need' },
  { label: 'Internal Maintenance', value: 'Internal Maintenance' },
  { label: 'Bad Service Experience', value: 'Bad Service Experience' },
  { label: 'Location / Coverage', value: 'Location / Coverage' },
  { label: 'Service Availability', value: 'Service Availability' },
  { label: 'Billing / Payment', value: 'Billing / Payment' },
  { label: 'Driver Related', value: 'Driver Related' },
  { label: 'Communication / Trust', value: 'Communication / Trust' },
  { label: 'Company / Management', value: 'Company / Management' },
  { label: 'Business Slowdown', value: 'Business Slowdown' },
  { label: 'Fleet Reduced', value: 'Fleet Reduced' },
  { label: 'Unknown', value: 'Unknown' },
  { label: 'Other', value: 'Other' }
]

// "What can bring the client back" while Re-engagement is still ongoing.
// Two siblings: WhatBroughtClientBackOptions below (same form, but for the
// Reactivated outcome specifically — past tense, narrower) and
// WhatCouldBringChurnedBackOptions in the Churned section (different scope
// again). All three are intentionally distinct per their own spec.
export const WhatCanBringBackOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'Additional Discount', value: 'Additional Discount' },
  { label: 'Promotion', value: 'Promotion' },
  { label: 'Better Shop', value: 'Better Shop' },
  { label: 'New Location', value: 'New Location' },
  { label: 'Better Coverage', value: 'Better Coverage' },
  { label: 'Resolve Previous Issue', value: 'Resolve Previous Issue' },
  { label: 'Better Service Quality', value: 'Better Service Quality' },
  { label: 'Faster Service', value: 'Faster Service' },
  { label: 'Billing Resolution', value: 'Billing Resolution' },
  { label: 'Better Payment Terms', value: 'Better Payment Terms' },
  { label: 'New Service', value: 'New Service' },
  { label: 'Explain Truck.me Again', value: 'Explain Truck.me Again' },
  { label: 'Inform Drivers', value: 'Inform Drivers' },
  { label: 'Contact New Decision Maker', value: 'Contact New Decision Maker' },
  { label: 'Better Communication', value: 'Better Communication' },
  { label: 'Better Support', value: 'Better Support' },
  { label: 'Sales Follow-up', value: 'Sales Follow-up' },
  { label: 'Fuel Sales Support', value: 'Fuel Sales Support' },
  { label: 'Client Needs Service Again', value: 'Client Needs Service Again' },
  { label: 'Follow Up Later', value: 'Follow Up Later' },
  { label: 'Nothing Currently', value: 'Nothing Currently' },
  { label: 'Unknown', value: 'Unknown' },
  { label: 'Other', value: 'Other' }
]

export const ReturnPotentialOptions = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
  { label: 'No Potential', value: 'No Potential' },
  { label: 'Unknown', value: 'Unknown' }
]

export const ReEngagementStatusOptions = [
  { label: 'New', value: 'New' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Waiting For Client', value: 'Waiting For Client' },
  {
    label: 'Waiting For Truck.me Action',
    value: 'Waiting For Truck.me Action'
  },
  { label: 'Service Expected', value: 'Service Expected' },
  { label: 'Follow-up Later', value: 'Follow-up Later' },
  { label: 'Ready To Close', value: 'Ready To Close' }
]

export const ReEngagementOutcomeOptions = [
  { label: 'Reactivated', value: 'Reactivated' },
  { label: 'Still Working', value: 'Still Working' },
  { label: 'Not Now', value: 'Not Now' },
  { label: 'Unable To Reach', value: 'Unable To Reach' },
  { label: 'Lost To Competitor', value: 'Lost To Competitor' },
  { label: 'Hard Refusal', value: 'Hard Refusal' },
  { label: 'Out Of Business', value: 'Out Of Business' },
  { label: 'Other', value: 'Other' }
]

// See the note on WhatCanBringBackOptions above — this is the Reactivated
// outcome's own (narrower, past-tense) version of that same idea.
export const WhatBroughtClientBackOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'Discount', value: 'Discount' },
  { label: 'Promotion', value: 'Promotion' },
  { label: 'Better Shop', value: 'Better Shop' },
  { label: 'New Location', value: 'New Location' },
  { label: 'Better Coverage', value: 'Better Coverage' },
  { label: 'Previous Issue Resolved', value: 'Previous Issue Resolved' },
  { label: 'Better Service Quality', value: 'Better Service Quality' },
  { label: 'Faster Service', value: 'Faster Service' },
  { label: 'Billing Issue Resolved', value: 'Billing Issue Resolved' },
  { label: 'Better Payment Terms', value: 'Better Payment Terms' },
  { label: 'New Service', value: 'New Service' },
  { label: 'Better Communication', value: 'Better Communication' },
  { label: 'Better Support', value: 'Better Support' },
  { label: 'Sales Follow-up', value: 'Sales Follow-up' },
  { label: 'Fuel Sales Support', value: 'Fuel Sales Support' },
  {
    label: 'Client Needed Service Again',
    value: 'Client Needed Service Again'
  },
  { label: 'Other', value: 'Other' }
]

export const WhyNotNowOptions = [
  { label: 'Service Not Needed Yet', value: 'Service Not Needed Yet' },
  { label: 'Low Mileage', value: 'Low Mileage' },
  { label: 'Seasonal Business', value: 'Seasonal Business' },
  {
    label: 'Trucks Temporarily Inactive',
    value: 'Trucks Temporarily Inactive'
  },
  { label: 'Budget', value: 'Budget' },
  { label: 'Waiting For Approval', value: 'Waiting For Approval' },
  { label: 'Waiting For Better Timing', value: 'Waiting For Better Timing' },
  { label: 'Business Slowdown', value: 'Business Slowdown' },
  { label: 'Other', value: 'Other' }
]

// ---------------------------------------------------------------------------
// Churned Feedback form (src/components/forms/ChurnedFeedbackForm.vue)
// — fields unique to this form; see the shared section above for the
// reason-branch fields it also uses via ReasonBranchFields.vue.
// ---------------------------------------------------------------------------

export const ChurnReasonOptions = [
  { label: 'Price', value: 'Price' },
  { label: 'Lost To Competitor', value: 'Lost To Competitor' },
  { label: 'Bad Service Experience', value: 'Bad Service Experience' },
  { label: 'No Current Need', value: 'No Current Need' },
  { label: 'Internal Maintenance', value: 'Internal Maintenance' },
  { label: 'Location / Coverage', value: 'Location / Coverage' },
  { label: 'Service Availability', value: 'Service Availability' },
  { label: 'Billing / Payment', value: 'Billing / Payment' },
  { label: 'Communication / Trust', value: 'Communication / Trust' },
  { label: 'Driver Related', value: 'Driver Related' },
  { label: 'Company / Management', value: 'Company / Management' },
  { label: 'Fleet Reduced', value: 'Fleet Reduced' },
  { label: 'Business Slowdown', value: 'Business Slowdown' },
  { label: 'Business Closed', value: 'Business Closed' },
  { label: 'Hard Refusal', value: 'Hard Refusal' },
  { label: 'Other', value: 'Other' }
]

export const ReturnPossibilityOptions = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
  { label: 'No Chance', value: 'No Chance' },
  { label: 'Unknown', value: 'Unknown' }
]

// See the note on WhatCanBringBackOptions above — Churned's own version of
// the "what could win the client back" question.
export const WhatCouldBringChurnedBackOptions = [
  { label: 'Better Price', value: 'Better Price' },
  { label: 'Additional Discount', value: 'Additional Discount' },
  { label: 'Promotion', value: 'Promotion' },
  { label: 'Better Shop', value: 'Better Shop' },
  { label: 'New Location', value: 'New Location' },
  { label: 'Better Coverage', value: 'Better Coverage' },
  { label: 'Resolve Previous Issue', value: 'Resolve Previous Issue' },
  { label: 'Better Service Quality', value: 'Better Service Quality' },
  { label: 'Faster Service', value: 'Faster Service' },
  { label: 'Billing Resolution', value: 'Billing Resolution' },
  { label: 'Better Payment Terms', value: 'Better Payment Terms' },
  { label: 'New Service', value: 'New Service' },
  { label: 'Better Communication', value: 'Better Communication' },
  { label: 'Better Support', value: 'Better Support' },
  { label: 'New Decision Maker', value: 'New Decision Maker' },
  { label: 'Fuel Sales Support', value: 'Fuel Sales Support' },
  { label: 'Relationship Recovery', value: 'Relationship Recovery' },
  {
    label: 'Business Becomes Active Again',
    value: 'Business Becomes Active Again'
  },
  { label: 'Other', value: 'Other' }
]
