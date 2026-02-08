// use for test (seed user + employee) only use in dev 


const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env')});


const User = require('../models/User');
const Employee = require('../models/Employee');



async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Do not run seed in production');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log('Seeding dev employees...');

  // clean the old seed data 
  await Employee.deleteMany({ hrFeedback: 'DEV_SEED' });
  await User.deleteMany({ email: /seed.*@test.com/ });

  // create user
const user1 = await User.create({
  username: 'seed_emp1',
  email: 'seed1@test.com',
  role: 'Employee',              
  password: 'SeedPass123!'       // fit requirement 
});

const user2 = await User.create({
  username: 'seed_emp2',
  email: 'seed2@test.com',
  role: 'Employee',
  password: 'SeedPass123!'
});

const users = [user1, user2];

  // create employee follow the schema
  const employees = users.map((user, i) => ({
    user: user._id,
    firstName: 'Test',
    lastName: `Employee${i + 1}`,
    address: {
      street: '123 Main St',
      city: 'San Jose',
      state: 'CA',
      zip: '95112'
    },
    phoneNumber: '123-456-7890',
    email: user.email,
    ssn: `123-45-67${i}0`,
    dob: new Date('1995-01-01'),
    gender: 'I do not wish to answer',
    residencyStatus: {
      isCitizenOrPermanentResident: false,
      statusType: 'No',
      workAuthorization: {
        type: 'F1(CPT/OPT)'
      }
    },
    emergencyContacts: [{
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '123-456-7890',
      email: 'emergency@test.com',
      relationship: 'Friend'
    }],
    applicationStatus: 'Pending',
    hrFeedback: 'DEV_SEED'
  }));

  await Employee.insertMany(employees);

  console.log('Dev employees seeded');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(' Seed failed:', err);
  process.exit(1);
});




