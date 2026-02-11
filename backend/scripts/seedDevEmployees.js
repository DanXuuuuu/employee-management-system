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
    "PENDING",    
    "APPROVED",   
    "REJECTED",  
    "PENDING",
    "APPROVED",
    "PENDING",
    "REJECTED",
    "APPROVED",
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
    hrFeedback: appStatuses[i].toUpperCase() === "REJECTED" ? "Does not meet requirements" : "",
  }));

  const employees = await Employee.insertMany(employeesPayloads);
 
  const steps = ["OPT Receipt", "OPT EAD", "I-983", "I-20"];
  const DEV_FILE = (name) => `https://example.com/DEV_SEED/${name}.pdf`;
  const DEV_FILE_KEY = (name) => `DEV_SEED/${name}.pdf`;

  const docs = [
  // user1 - OPT Receipt Approved, waiting for OPT EAD upload (In Progress)
  {
    owner: users[0]._id,
    type: "OPT Receipt",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u1_opt_receipt"),
    fileKey: DEV_FILE_KEY("u1_opt_receipt"),
    fileName: "u1_opt_receipt.pdf",
  },

  // user2 - OPT EAD pending review (In Progress)
  {
    owner: users[1]._id,
    type: "OPT Receipt",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u2_opt_receipt"),
    fileKey: DEV_FILE_KEY("u2_opt_receipt"),
    fileName: "u2_opt_receipt.pdf",
  },
  {
    owner: users[1]._id,
    type: "OPT EAD",
    status: "Pending",
    feedback: "",
    fileUrl: DEV_FILE("u2_opt_ead"),
    fileKey: DEV_FILE_KEY("u2_opt_ead"),
    fileName: "u2_opt_ead.pdf",
  },

  // user3 - I-983 rejected, need re-upload (In Progress)
  {
    owner: users[2]._id,
    type: "OPT Receipt",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u3_opt_receipt"),
    fileKey: DEV_FILE_KEY("u3_opt_receipt"),
    fileName: "u3_opt_receipt.pdf",
  },
  {
    owner: users[2]._id,
    type: "OPT EAD",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u3_opt_ead"),
    fileKey: DEV_FILE_KEY("u3_opt_ead"),
    fileName: "u3_opt_ead.pdf",
  },
  {
    owner: users[2]._id,
    type: "I-983",
    status: "Rejected",
    feedback: "Missing signature",
    fileUrl: DEV_FILE("u3_i983"),
    fileKey: DEV_FILE_KEY("u3_i983"),
    fileName: "u3_i983.pdf",
  },

  // user4 - Waiting for OPT Receipt upload (In Progress)
  // No documents yet

  // user5 - ALL APPROVED - Complete! (NOT In Progress, but in All Employees)
  {
    owner: users[4]._id,
    type: "OPT Receipt",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u5_opt_receipt"),
    fileKey: DEV_FILE_KEY("u5_opt_receipt"),
    fileName: "u5_opt_receipt.pdf",
  },
  {
    owner: users[4]._id,
    type: "OPT EAD",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u5_opt_ead"),
    fileKey: DEV_FILE_KEY("u5_opt_ead"),
    fileName: "u5_opt_ead.pdf",
  },
  {
    owner: users[4]._id,
    type: "I-983",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u5_i983"),
    fileKey: DEV_FILE_KEY("u5_i983"),
    fileName: "u5_i983.pdf",
  },
  {
    owner: users[4]._id,
    type: "I-20",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u5_i20"),
    fileKey: DEV_FILE_KEY("u5_i20"),
    fileName: "u5_i20.pdf",
  },

  // user6 - I-20 pending (In Progress)
  {
    owner: users[5]._id,
    type: "OPT Receipt",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u6_opt_receipt"),
    fileKey: DEV_FILE_KEY("u6_opt_receipt"),
    fileName: "u6_opt_receipt.pdf",
  },
  {
    owner: users[5]._id,
    type: "OPT EAD",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u6_opt_ead"),
    fileKey: DEV_FILE_KEY("u6_opt_ead"),
    fileName: "u6_opt_ead.pdf",
  },
  {
    owner: users[5]._id,
    type: "I-983",
    status: "Approved",
    feedback: "",
    fileUrl: DEV_FILE("u6_i983"),
    fileKey: DEV_FILE_KEY("u6_i983"),
    fileName: "u6_i983.pdf",
  },
  {
    owner: users[5]._id,
    type: "I-20",
    status: "Pending",
    feedback: "",
    fileUrl: DEV_FILE("u6_i20"),
    fileKey: DEV_FILE_KEY("u6_i20"),
    fileName: "u6_i20.pdf",
  },

  // user7 & user8 - Just started, no docs yet (In Progress)
];

  // Only insert if actually have Document model
  if (Document) { 
    const createdDocs = await Document.insertMany(docs);
    
    //  relate docs to Employee
    for (const doc of createdDocs) {
      await Employee.findOneAndUpdate(
        { user: doc.owner },
        { $addToSet: { documents: doc._id } },
         { returnDocument: 'after' }
      );
    }
  }

  console.log("Dev employees seeded:", employees.length);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
