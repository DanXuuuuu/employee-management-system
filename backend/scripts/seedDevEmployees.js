// use for test (seed user + employee + visa docs) only use in dev

const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const User = require("../models/User");
const Employee = require("../models/Employee");
const Document = require("../models/Document");  

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not run seed in production");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Seeding dev employees...");

  // clean old seed data
  await Employee.deleteMany({ email: /seed\d+@test\.com/ });
  await User.deleteMany({ email: /seed\d+@test\.com/ });
  await Document.deleteMany({ fileUrl: /DEV_SEED/ }); // safe cleanup marker

  //   create 8 users 
  const password = "SeedPass123!"; // matches  password validator

  const userPayloads = Array.from({ length: 8 }).map((_, i) => ({
    username: `seed_emp${i + 1}`,
    email: `seed${i + 1}@test.com`,
    role: "Employee",
    password,
  }));

  const users = await User.insertMany(userPayloads);
 
  //   create 8 employees  
  const appStatuses = [
    "Pending",
    "Approved",
    "Rejected",
    "Pending",
    "Approved",
    "Pending",
    "Rejected",
    "Approved",
  ];

  const employeesPayloads = users.map((user, i) => ({
    user: user._id,
    firstName: "Test",
    lastName: `Employee${i + 1}`,
    preferredName: i % 2 === 0 ? `T${i + 1}` : undefined,
    address: {
      street: "123 Main St",
      city: "San Jose",
      state: "CA",
      zip: "95112",
    },
    phoneNumber: `123-456-78${(i + 10).toString().slice(-2)}`,
    email: user.email,
    ssn: `123-45-67${i}${i}`, // just unique-ish
    dob: new Date("1995-01-01"),
    gender: "I do not wish to answer",
    residencyStatus: {
      isCitizenOrPermanentResident: false,
      statusType: "No",
      workAuthorization: {
        type: "F1(CPT/OPT)",
        // give some endDate so daysRemaining works
        endDate: new Date(Date.now() + (60 + i * 10) * 24 * 60 * 60 * 1000),
      },
    },
    emergencyContacts: [
      {
        firstName: "Jane",
        lastName: "Doe",
        phone: "123-456-7890",
        email: "emergency@test.com",
        relationship: "Friend",
      },
    ],
    applicationStatus: appStatuses[i],
    hrFeedback: appStatuses[i] === "Rejected" ? "Does not meet requirements" : "",
  }));

  const employees = await Employee.insertMany(employeesPayloads);
 
  const steps = ["OPT Receipt", "OPT EAD", "I-983", "I-20"];
  const DEV_FILE = (name) => `https://example.com/DEV_SEED/${name}.pdf`;
  const DEV_FILE_KEY = (name) => `DEV_SEED/${name}.pdf`;

  const docs = [
    // user1
    {
      owner: users[0]._id,
      type: "OPT Receipt",
      status: "Approved",
      feedback: "",
      fileUrl: DEV_FILE("u1_opt_receipt"),
      fileKey: DEV_FILE_KEY("u1_opt_receipt"),
    },
    {
      owner: users[0]._id,
      type: "OPT EAD",
      status: "Pending",
      feedback: "",
      fileUrl: DEV_FILE("u1_opt_ead"),
      fileKey: DEV_FILE_KEY("u1_opt_ead"),
    },

    // user2
    {
      owner: users[1]._id,
      type: "OPT Receipt",
      status: "Approved",
      feedback: "",
      fileUrl: DEV_FILE("u2_opt_receipt"),
      fileKey: DEV_FILE_KEY("u2_opt_receipt"),
    },
    {
      owner: users[1]._id,
      type: "OPT EAD",
      status: "Rejected",
      feedback: "blurry", 
      fileUrl: DEV_FILE("u2_opt_ead"),
      fileKey: DEV_FILE_KEY("u2_opt_ead"),
    },

    // user4
    {
      owner: users[3]._id,
      type: "OPT Receipt",
      status: "Pending",
      feedback: "",
      fileUrl: DEV_FILE("u4_opt_receipt"),
      fileKey: DEV_FILE_KEY("u4_opt_receipt"),
    },
  ];

  // Only insert if actually have Document model
  if (Document) { 
    await Document.insertMany(
      docs.map((d) => ({  
        owner: d.owner,
        type: steps.includes(d.type) ? d.type : "OPT Receipt",
        status: d.status,
        feedback: d.feedback || "",
        fileUrl: d.fileUrl,
        fileKey: `DEV_SEED/${d.owner}_${d.type}.pdf`,
      }))
    );
  }

  console.log("Dev employees seeded:", employees.length);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
