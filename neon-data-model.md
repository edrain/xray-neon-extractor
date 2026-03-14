# XRAY's Neon CRM Data Model

Reference for understanding what data exists in XRAY's Neon CRM instance. All data pulled live from the API on 2026-03-14.

## Campaigns

Fundraising efforts tied to donations. Campaigns are time-bound. Each donation belongs to one campaign.

| ID | Name |
|----|------|
| 1 | Station Launch |
| 2 | Kickstarter Backers |
| 3 | 2014 Fund Drives - Year 1 |
| 4 | One-Time |
| 5 | Recurring |
| 7 | Give!Guide 2014 |
| 9 | 2015 Fall Fund Drive Recurring |
| 10 | 2015 Fall Fund Drive One-Time |
| 11 | 2015-16 Non-Drive Recurring (11/15-3/16) |
| 12 | 2015-16 Non-Drive One-Time (11/15-3/16) |
| 15 | Give!Guide |
| 17 | FY16 Underwriting |
| 19 | Underwriting |
| 20 | 2016 Spring Fund Drive One Time |
| 21 | 2016 Spring Fund Drive Recurring |
| 27 | 2016 Fall Fund Drive Recurring |
| 28 | 2016 Fall Fund Drive One Time |
| 30 | 2017 Spring Fund Drive One Time |
| 31 | 2017 Spring Fund Drive Recurring |
| 32 | 2017 Spring Fund Drive T Shirt |
| 34 | 2017 Fall Fund Drive One Time |
| 37 | 2018 Spring Fund Drive One Time |
| 40 | 2018 Fall Fund Drive One Time |
| 44 | 2019 Spring Fund Drive One Time |
| 48 | 2019 Fall Fund Drive - One Time |
| 49 | 2019 Fall Fund Drive - Recurring |
| 50 | 2020 XRAY Awards |
| 51 | 2020 Spring Fund Drive Peer to Peer |
| 53 | 2020 Spring Fund Drive One Time |
| 54 | 2020 Spring Fund Drive Recurring |
| 55 | 2020 XRAY.fm House Shows |
| 57 | 2020 Fall Fund Drive-Recurring |
| 58 | 2020 Fall Fund Drive-One Time |
| 59 | 2020 Fall Fund Drive Peer 2 Peer |
| 62 | 2021 Spring Fund Drive One Time |
| 63 | 2021 Spring Fund Drive Peer 2 Peer |
| 65 | 2021 Spring Fund Drive Tshirt |
| 66 | Generic App Donation Form |
| 68 | 2021 Fall Fund Drive Recurring |
| 70 | 2021 Fall Fund Drive Hoodies |
| 72 | 2022 Spring Fund Drive One Time |
| 90 | 2023 Spring Fund Drive Peer 2 Peer |
| 94 | 107.1 Capital Campaign |
| 95 | 2023 Fall Fund Drive One Time |
| 96 | 2023 Fall Fund Drive Recurring |
| 157 | 2024 Spring Fund Drive One Time |
| 158 | 2024 Spring Fund Drive Recurring |
| 217 | 2025 Spring Peer 2 Peer |
| 225 | Fall 2025 Peer to Peer |
| 226 | 2025 Fall Drive |

## Funds

Accounting categories on donations. Every donation has both a Campaign and a Fund.

| Code | Name |
|------|------|
| 107 | 107.1 Capital Campaign |
| 410 | Recurring Membership |
| 411 | General One Time |
| 412 | Give!Guide |
| 415 | One Time Membership |
| 420 | General Underwriting |
| 440 | Major Gifts |
| 450 | Small One Time Gifts |
| 460 | Events |
| 470 | Merchandise |
| (none) | House Shows: Artist Support Fund |
| INDV | Individual Donations |
| MMBR | Memberships |
| UNDR | Underwriting |

## Membership Levels

| Level |
|-------|
| XRAY.fm Member |
| XRAY.fm Founding Member |
| XRAY.fm Rockstar Member |
| XRAY Visionary |
| Student/Senior/Starving Artist Membership |
| XRAY Underwriter/Sponsor |
| XRAY In Kind/Trade Sponsor |
| Numberz Underwriter/Sponsor |

## Membership Statuses

- **Active** — current member
- **Inactive** — lapsed/expired

## Donation Types

- `DONATION` — all donations use this single type

## Custom Fields — Account (40 fields)

| Category | Fields |
|----------|--------|
| Prospect/donor info | Ask Them About, Biographical Info, History with XRAY, Prospect Occupation and/or potential wealth qualification, Potential Prospect: Giving Below Means |
| Interest tracking | Interest Tracking, Music Genre Interests (Interest Tracking Step 2), Talk Content Interests [Interest Tracking Step 2], Music v. Talk |
| Contact history | Contact Preferences, Contacted Text Fall 21, Contacted Spring '22, Texted Fall '22, Contact History / Notes Spring 2023, Contact History \| Fall 2023, Contacted History \| Spring 24 (Initials), Fall 24 Contact History Pass 1, Fall 24 Contact History Pass 2, Most Recent Call/Text Result (FD) |
| Membership ops | Member Keytag Number, Membership Cancellation Reason, Renewal Possibility/Pause Context, Received Member Window Cling? |
| Community/events | House Party Status, Help us build XRAY.FM by hosting a house party!, What date would work for you to host or co-host a house party?, Ways to help, Other, Coast Connections |
| Tech donations | Tech Donations (Only in Good Condition), Tech Donations--Tell us more about your item., Can you drop off your item at 5415 N Albina Ave?, Would you like a donation receipt for your donated item if we're able to take it?, If you do need a receipt what is the estimated fair market value of your item? |
| Communication | Text-Newsletter Opt-in |
| Other | DOB, If eligible to be entered to the daily fund drive giveaway that is age-restricted per the OLCC please enter your date of birth. |

## Custom Fields — Donation (84 fields)

Mostly thank-you gift selections organized by fund drive season.

| Category | Fields |
|----------|--------|
| Gift preferences | Should we send you thank you gifts?, Incentive/Giveaway Opt In, Giveaway Interest, Giveaway Entries Spring 2025 |
| Size/merch choices | If applicable: What size should we send you?, What size should we send you?, Merch Color Choice, Type of Tote, Customization, 2025 Spring Tee Color |
| Season gift fields | 2017 Fall Fund Drive Gifts--OT, 2017 Fall Fund Drive--R, 2019 Spring/Fall gifts, 2020-2024 OT/Recurring/App Form gifts (one set per drive season), General OT/Monthly/App Gift |
| Donor comms | Shout Out, Notes, Newsletter Opt Out |
| Swap meet | What genre(s) do you specialize in?, What formats of music are you bringing?, Any questions you have for us?, Can you pick up your item at Falcon? |
| Account custom fields | All 40 account custom fields are also available as donation output fields |

## API Structure

### Two search endpoints

| Endpoint | Returns | Best for |
|----------|---------|----------|
| `POST /accounts/search` | One row per account, aggregate data | Membership status, giving totals, contact info |
| `POST /donations/search` | One row per donation, with account info | Filtering by campaign, fund, date; individual donation details |

### Key concepts

- **Campaign vs Fund**: Campaigns are time-bound fundraising efforts (e.g., "2024 Spring Fund Drive"). Funds are accounting categories (e.g., "411 - General One Time"). Every donation has both.
- **Search field** = what you filter on. **Output field** = what columns come back in results.
- **Donation Campaign** is the search field name for filtering donations by campaign; **Campaign Name** is the output field name that shows the campaign in results.
- **Membership data** lives on accounts. `Account Current Membership Status` is available as both a search field and output field on both account and donation searches.

### Scale

- ~167,760 donation records
- ~4,426 accounts with membership history
- Pagination: `{currentPage, pageSize}` with max 200 per page

### Account output fields (~1,490 total)

- ~610 non-year-specific fields (contact info, membership, activity, prospect, windfall data, etc.)
- ~880 year-specific aggregate fields (donation/membership/event totals per calendar year and fiscal year, from 2016 onward)
- Notable fields: `Account Current Membership Status`, `First/Last Donation Campaign`, `Largest Donation Campaign`, `Top Campaign`, `Top Fund`, `All Time Donation Total`, per-year donation/membership totals

### Donation output fields (~650 non-year + year aggregates)

- Per-donation: `Donation ID`, `Donation Amount`, `Donation Date`, `Donation Status`, `Donation Type`, `Campaign Name`, `Campaign ID`, `Fund`, `Fund Code`, `Purpose`, `Recurring Donation`, `Recurring Donation Frequency/Status/Campaign`
- Per-account (on each donation row): all contact fields, membership fields, aggregate totals
- Payment: `Tender Type`, `Check Number`, `Credit Card Type/Last 4`, `Payment Status`
- Soft credits: distributor info, soft credit amount/percentage
- Tribute: tribute name, type

### Key search fields for donations

| Field | Operators | Notes |
|-------|-----------|-------|
| Donation Campaign | EQUAL, NOT_EQUAL, BLANK, NOT_BLANK, IN_RANGE, NOT_IN_RANGE | Filter by campaign name |
| Donation Fund | EQUAL, NOT_EQUAL, BLANK, NOT_BLANK, IN_RANGE, NOT_IN_RANGE | Filter by fund |
| Donation Date | EQUAL, NOT_EQUAL, BLANK, NOT_BLANK, LESS_THAN, GREATER_THAN, IN_RANGE | Date filtering |
| Donation Status | EQUAL, NOT_EQUAL, IN_RANGE | SUCCEEDED, etc. |
| Donation Amount | EQUAL, GREATER_THAN, LESS_THAN, IN_RANGE | Amount filtering |
| Account Current Membership Status | EQUAL, NOT_EQUAL, BLANK, NOT_BLANK | Active/Inactive |
| Membership Level | EQUAL, NOT_EQUAL, BLANK, NOT_BLANK, IN_RANGE | Filter by tier |
| Recurring Donation | EQUAL, NOT_EQUAL | Yes/No |
| Account ID | EQUAL, NOT_EQUAL, IN_RANGE | Link to specific accounts |

### Key search fields for accounts

| Field | Operators | Notes |
|-------|-----------|-------|
| Account Current Membership Status | EQUAL, NOT_EQUAL | Active/Inactive |
| Account ID | EQUAL, NOT_EQUAL, CONTAIN, IN_RANGE | |
| First Name, Last Name, Email | EQUAL, CONTAIN, BLANK, NOT_BLANK | Contact lookup |
| Account Type | EQUAL, NOT_EQUAL | Individual vs Company |
| Membership Level | EQUAL, NOT_EQUAL, IN_RANGE | |
| Membership Expiration Date | date operators | |

### Other endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/accounts/search/outputFields` | GET | List all available account output fields |
| `/accounts/search/searchFields` | GET | List all available account search fields |
| `/donations/search/outputFields` | GET | List all available donation output fields (undocumented but works) |
| `/donations/search/searchFields` | GET | List all available donation search fields (undocumented but works) |
| `/customFields?category=X` | GET | Custom fields by category (Account, Donation, Membership, Event, Attendee, Activity) |
| `/accounts/{id}` | GET | Single account details |
| `/donations/{id}` | GET | Single donation details |
| `/events` | GET | List events |
| `/events/{id}/attendees` | GET | Event attendees |
