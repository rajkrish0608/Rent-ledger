# RentLedger - Demo Credentials & Testing Guide

## 📧 Demo User Accounts

### Test Account 1: Broker User
```
Email: broker@test.com
Password: Test123!
Role: BROKER
```

**Use this account to:**
- Create new rental timelines
- Add events to rentals
- Verify hash chain integrity
- Test full broker dashboard features

---

### Test Account 2: Tenant User (Create as needed)
```
Email: tenant@test.com
Password: password123
Role: TENANT
```

**Use this account to:**
- View assigned rentals
- Add tenant-side events
- Upload rent payment proofs

---

### Test Account 3: Landlord User (Create as needed)
```
Email: landlord@test.com
Password: password123
Role: LANDLORD
```

**Use this account to:**
- View properties
- Track rent payments
- Issue notices

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm run start:dev
```

**Backend URL:** `http://localhost:3000/api`

### 2. Frontend Setup (iOS Simulator)
```bash
cd frontend
flutter run -d <simulator-id>
```

### 3. Create Demo User (if not exists)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@test.com",
    "password": "Test123!",
    "name": "Demo Broker",
    "phone": "+919876543210",
    "role": "BROKER"
  }'
```

---

## 🎯 Testing Workflow

### Step 1: Login
1. Launch app on iOS Simulator
2. Use credentials: `broker@test.com` / `Test123!`
3. You'll be redirected to "My Rentals" screen

### Step 2: View Rentals (if any exist)
- See list of rental cards
- Each card shows:
  - Property address
  - Status badge (Active/Closed)
  - Participants
  - Event count
- Pull down to refresh

### Step 3: Create a Rental (Backend API)
Since Create Rental UI isn't built yet, use curl:

```bash
# Get your access token first (from login response)
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/rentals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_address": "123 Demo Street, Mumbai",
    "property_unit": "Flat 401",
    "start_date": "2026-01-01T00:00:00.000Z",
    "participants": [
      {
        "email": "tenant@test.com",
        "role": "TENANT"
      }
    ]
  }'
```

### Step 4: View Timeline
1. Tap on any rental card
2. Timeline screen opens
3. See visual timeline with events
4. Tap "Verify" icon to check hash chain integrity

### Step 5: Add Event
1. On timeline, tap "+" FAB button
2. Select event type (Move-in, Rent Paid, etc.)
3. Select actor type (Tenant, Landlord, Broker)
4. Fill description: "First rent payment"
5. Add notes (optional)
6. If rent event, add amount: "25000"
7. Submit → Event appears in timeline with hash

### Step 6: Verify Hash Chain
1. Tap shield/verification icon in app bar
2. System checks cryptographic integrity
3. See "Verified ✅" dialog
4. Confirms timeline is court-admissible

---

## 📱 What You Should See in the App

### 1. Login Screen
- RentLedger branding
- Email & password fields
- "Login" and "Register" buttons

### 2. My Rentals Screen (After Login)
**If No Rentals:**
- Empty state icon
- "No Rentals Yet" message
- "Create Rental" button

**If Rentals Exist:**
- List of rental cards
- Each card shows:
  ```
  🟢 ACTIVE
  📍 123 Demo Street, Mumbai
     Unit: Flat 401
  📅 Started: Jan 01, 2026
  
  👤 John Doe (Tenant)  👤 Jane Smith (Landlord)
  🔔 5 events
  ```

### 3. Timeline Screen
```
┌─────────────────────────────────┐
│  123 Demo Street, Mumbai        │
│  Unit: Flat 401                 │
│  🟢 ACTIVE                      │
│  🛡️ Verify   ⋮ Options          │
└─────────────────────────────────┘

    Timeline:

    ●  MOVE_IN
    │  📝 Tenant moved into property
    │  👤 John Doe (Tenant)
    │  🕐 Jan 05, 2026 - 10:30
    │  🔗 Hash: 3a7f2b1c...
    │
    ●  RENT_PAID
    │  📝 First rent payment
    │  💰 Amount: ₹25,000
    │  👤 John Doe (Tenant)
    │  🕐 Jan 10, 2026 - 14:20
    │  🔗 Hash: 9d4e8f3a...
    │
    ●  INSPECTION
       📝 Quarterly property inspection
       👤 Demo Broker (Broker)
       🕐 Feb 01, 2026 - 11:00
       🔗 Hash: 5c2a1b9e...

[+] Add Event (FAB button)
```

### 4. Add Event Screen
```
┌─────────────────────────────────┐
│  Event Type                     │
│  🏠 Move-in                ▼    │
│                                 │
│  Actor Type                     │
│  👤 Tenant                 ▼    │
│                                 │
│  Description *                  │
│  ┌───────────────────────────┐ │
│  │ First rent payment        │ │
│  └───────────────────────────┘ │
│                                 │
│  Notes (Optional)               │
│  ┌───────────────────────────┐ │
│  │ Paid via UPI              │ │
│  └───────────────────────────┘ │
│                                 │
│  Amount                         │
│  ┌───────────────────────────┐ │
│  │ ₹ 25000                   │ │
│  └───────────────────────────┘ │
│                                 │
│  ⓘ This event is immutable and │
│     cryptographically linked    │
│                                 │
│  [ Add Event to Timeline ]      │
└─────────────────────────────────┘
```

---

## 🎨 UI Features You'll Experience

### Visual Design
- ✅ Clean Material Design 3 interface
- ✅ Color-coded event types
- ✅  Status badges (green for active, gray for closed)
- ✅ Smooth animations
- ✅ Consistent spacing

### Interactions
- ✅ Pull-to-refresh on rental list
- ✅ Tap rental → Open timeline
- ✅ Tap + button → Add event
- ✅ Tap verify → Check integrity
- ✅ Real-time loading states
- ✅ Error handling with retry buttons
- ✅ Success/error snackbars

### Timeline Visualization
- ✅ Vertical timeline with connecting lines
- ✅ Color-coded event icons
  - 🟢 Green = Move-in
  - 🔵 Blue = Rent Paid
  - 🟣 Purple = Repair
  - 🟠 Orange = Move-out
  - 🔴 Red = Rent Delayed
- ✅ Expandable event cards
- ✅ Hash preview (truncated)

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path
1. Login as broker
2. See rental list
3. Tap rental
4. View timeline
5. Add "Rent Paid" event
6. Verify hash chain → ✅ Verified
7. Pull to refresh → Event appears

### Scenario 2: Hash Verification
1. Create multiple events
2. Tap verification icon
3. See "Verified ✅" dialog
4. Message: "All events cryptographically linked"

### Scenario 3: Empty States
1. Login with new account (no rentals)
2. See empty state illustration
3. Message: "No Rentals Yet"
4. Tap "Create Rental" (shows API integration needed)

### Scenario 4: Error Handling
1. Turn off backend server
2. Try to load rentals
3. See error message
4. Tap "Retry" button
5. Turn on server
6. Rentals load successfully

---

## 🔐 Security Notes

- ✅ All API calls require JWT authentication
- ✅ Passwords hashed with bcrypt
- ✅ Access control: users only see their rentals
- ✅ Events are immutable (append-only)
- ✅ Hash chain prevents tampering

---

## 📦 Available API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Rentals
```
GET    /api/rentals           # List my rentals
POST   /api/rentals           # Create rental
GET    /api/rentals/:id       # Get rental details
POST   /api/rentals/:id/close # Close rental
GET    /api/rentals/:id/verify # Verify hash chain
```

### Events
```
POST   /api/events                   # Create event
GET    /api/events/rental/:rentalId  # List events
GET    /api/events/:id               # Get event details
```

---

## 🎯 Phase 2 Status

### ✅ Working Features
1. Login/Register
2. My Rentals list
3. Timeline visualization
4. Event creation
5. Hash chain verification
6. Pull-to-refresh
7. Error handling
8. Loading states

### ❌ Not Yet Implemented
1. Create Rental UI (use API directly)
2. Edit Participant
3. Media upload
4. Export PDF (Phase 3)
5. Notifications (Phase 3)

---

## 🚀 Phase 3 Preview (Coming Soon)

- 📄 PDF Export (court-admissible evidence)
- 🔔 Email & Push Notifications
- 📊 Broker Dashboard with analytics
- 🔍 OCR for document processing
- 🏢 Society Management Dashboard

---

## 💡 Tips for Testing

1. **Keep Backend Running:** Always ensure `npm run start:dev` is active
2. **Check Logs:** Watch terminal for API requests
3. **Use Postman:** Test APIs before UI integration
4. **Clear App Data:** If issues occur, uninstall and reinstall app
5. **Hot Reload:** Press 'r' in terminal for quick UI updates
6. **Hot Restart:** Press 'R' for full app restart

---

## 🐛 Known Issues

1. Create Rental UI not built yet (use API)
2. Some enum display names may need refinement
3. Pagination not fully tested with large datasets

---

## 📞 Support

For issues or questions, check:
- `PHASE_2_PROGRESS.md` - Implementation details
- `PHASE_2_TESTING.md` - API testing guide
- `MASTER_INDEX.md` - Project overview

---

**Last Updated:** 2026-02-07  
**Version:** Phase 2.5 (UI Complete, PDF Export In Progress)
