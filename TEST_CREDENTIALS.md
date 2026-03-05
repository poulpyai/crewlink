# CrewLink Test Accounts

**Password for all accounts:** `qazwsxedc`

## Test Users

### Pilot
- **Email:** qdelarre1@gmail.com
- **Role:** pilot
- **Use for:** Creating bookings, testing pilot-side flows

### AME (Aviation Medical Examiner)
- **Email:** enquiry@typepulse.com
- **Role:** ame
- **Use for:** Managing AME slots, confirming medical appointments

### Examiner (TRE/TRI)
- **Email:** tinoudelarre@gmail.com
- **Role:** examiner
- **Use for:** Managing examiner slots, confirming rating/license checks

### Simulator Company
- **Email:** qdelarre@gmail.com
- **Role:** sim_company
- **Use for:** Managing simulator slots, confirming simulator bookings

---

## Testing Flows

### Flow 1: AME Booking
1. Log in as **Pilot** (qdelarre1@gmail.com)
2. Browse AME slots → Book appointment
3. Log in as **AME** (enquiry@typepulse.com)
4. Go to Bookings → Confirm request
5. Verify slot shows "Booked"
6. Test messaging

### Flow 2: Examiner Booking
1. Log in as **Pilot** (qdelarre1@gmail.com)
2. Browse examiner slots → Book session
3. Log in as **Examiner** (tinoudelarre@gmail.com)
4. Go to Bookings → Confirm request
5. Verify slot shows "Booked"

### Flow 3: Simulator Booking
1. Log in as **Pilot** (qdelarre1@gmail.com)
2. Browse simulators → Book session
3. Log in as **Sim Company** (qdelarre@gmail.com)
4. Go to Bookings → Confirm request
5. Verify slot shows "Booked"

---

**Note:** Keep this file secure - contains working credentials for development environment.
