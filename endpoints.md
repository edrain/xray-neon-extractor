# Neon CRM API v2 Endpoints

**Base URL:** `https://api.neoncrm.com/v2`

## Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/search` | Search accounts |
| GET | `/accounts/search/outputFields` | Get available output fields |
| GET | `/accounts/search/searchFields` | Get available search fields |
| GET | `/accounts/{id}` | Get single account |
| POST | `/accounts` | Create account |
| PATCH | `/accounts/{id}` | Update account |

## Donations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/donations/search` | Search donations |
| GET | `/donations/{id}` | Get single donation |
| POST | `/donations` | Create donation |

## Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List all events |
| GET | `/events/{id}` | Get single event |
| GET | `/events/{id}/attendees` | List event attendees |
| POST | `/events/{id}/registrations` | Create registration |

## Custom Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customFields?category=X` | Get custom fields by category |

Categories: `Account`, `Donation`, `Membership`, `Event`, `Attendee`, `Activity`

## Other Endpoints (v2.9+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/volunteers` | List volunteers |
| GET/POST | `/groups` | Volunteer groups |
| GET/PUT/DELETE | `/groups/{id}` | Manage volunteer group |
| GET/POST | `/opportunities` | Volunteer opportunities |
| GET/PUT/PATCH/DELETE | `/opportunities/{id}` | Manage volunteer opportunity |

## Notes

- **Memberships**: No standalone `/memberships` endpoint. Membership data is accessed via account search with membership-related output fields.
- **Activities**: No standalone `/activities` endpoint. Activity data is accessed via account search with activity-related output fields.
- **Event Attendees**: Use `GET /events/{id}/attendees` to get attendees for a specific event.

## Sources

- [Neon CRM API v2 Docs](https://developer.neoncrm.com/api-v2/)
- [Retrieve Event Attendees](https://developer.neoncrm.com/api/events/retrieve-event-attendees/)
- [Events API](https://developer.neoncrm.com/api/events/)
- [Postman Collection](https://documenter.getpostman.com/view/3198276/TVemCAFj)
