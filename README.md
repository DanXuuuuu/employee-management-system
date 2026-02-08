# employee-management-system
Employee onboarding management system

## Dev Seed (Test Data)

This project includes a dev seed script to quickly generate test accounts and employee data for demo/testing.

### Run Seed
1. Configure backend environment variables:
   - Create `backend/.env`
   - Set `MONGODB_URI=...` (your MongoDB connection string)

2. Run the seed script:
```bash
cd employee-management-system
node backend/scripts/seedDevEmployees.js
