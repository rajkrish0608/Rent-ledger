# Phase 2: Rental Timeline Engine - Testing Guide

## Quick Backend API Test

Use these curl commands to test the rental timeline engine:

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@test.com",
    "password": "Test123!",
    "name": "Test Broker",
    "role": "BROKER"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@test.com",
    "password": "Test123!"
  }'
```

**Save the `access_token` from the response!**

### 3. Create a Rental
```bash
curl -X POST http://localhost:3000/api/rentals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "property_address": "123 Main St, Apartment 4B",
    "property_unit": "4B",
    "start_date": "2026-02-01T00:00:00.000Z"
  }'
```

**Save the rental `id` from the response!**

### 4. Get My Rentals
```bash
curl -X GET http://localhost:3000/api/rentals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create an Event
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "rental_id": "YOUR_RENTAL_ID",
    "event_type": "MOVE_IN",
    "event_data": {
      "description": "Tenant moved in",
      "notes": "All keys handed over"
    },
    "actor_type": "BROKER"
  }'
```

### 6. Get Events for Rental
```bash
curl -X GET "http://localhost:3000/api/events/rental/YOUR_RENTAL_ID?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Verify Hash Chain Integrity
```bash
curl -X GET http://localhost:3000/api/rentals/YOUR_RENTAL_ID/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "valid": true,
  "errors": []
}
```

## Test Scenario: Complete Rental Timeline

1. **Create rental** → Get rental ID
2. **Add MOVE_IN event** → First event in chain (previous_hash: null)
3. **Add RENT_PAID event** → Links to MOVE_IN hash
4. **Add REPAIR_REQUEST event** → Links to RENT_PAID hash
5. **Verify integrity** → Should return `valid: true`

Each event will have:
- `current_event_hash`: SHA-256 of this event
- `previous_event_hash`: SHA-256 of previous event (or null for first)

This creates a tamper-evident chain!

## Event Types Available

- `MOVE_IN` - Tenant moved into property
- `MOVE_OUT` - Tenant moved out
- `RENT_PAID` - Rent payment received
- `RENT_DELAYED` - Rent payment delayed
- `REPAIR_REQUEST` - Maintenance request
- `REPAIR_COMPLETED` - Repair finished
- `NOTICE_ISSUED` - Legal notice issued
- `COMPLAINT` - Complaint filed
- `INSPECTION` - Property inspection

## Actor Types

- `TENANT` - Tenant user
- `LANDLORD` - Property owner
- `BROKER` - Rental broker/agent
- `SOCIETY` - Housing society admin
- `SYSTEM` - Automated system event
