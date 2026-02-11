const Employee = require("../models/Employee");

/**
 * GET /api/personal-info
 */
exports.getPersonalInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;

 
    const employee = await Employee.findOne({ user: userId }).populate('documents');
    
    if (!employee) {
      return res.status(404).json({
        ok: false,
        message: "Employee profile not found. Please complete onboarding first.",
      });
    }

    return res.json({ ok: true, data: employee });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/personal-info/:section
 */
exports.updatePersonalInfoSection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { section } = req.params;
    const payload = req.body || {};

    const allowed = new Set(["name", "address", "contact", "employment", "emergency", "reference"]);
    if (!allowed.has(section)) {
      return res.status(400).json({ ok: false, message: "Invalid section" });
    }

    const $set = {};

    // 按照文档要求进行字段映射
    if (section === "name") {
      const fields = ["firstName", "lastName", "middleName", "preferredName", "profilePicture", "gender", "dob"];
      fields.forEach(f => { if (f in payload) $set[f] = payload[f]; });
    }

    if (section === "address") {
      const fields = ["building", "street", "city", "state", "zip"];
      fields.forEach(f => { if (f in payload) $set[`address.${f}`] = payload[f]; });
    }

    if (section === "contact") {
      if ("phoneNumber" in payload) $set.phoneNumber = payload.phoneNumber;
      if ("workPhoneNumber" in payload) $set.workPhoneNumber = payload.workPhoneNumber;
    }

    if (section === "employment") {
  
      if ("visaTitle" in payload) $set["residencyStatus.workAuthorization.type"] = payload.visaTitle;
      if ("startDate" in payload) $set["residencyStatus.workAuthorization.startDate"] = payload.startDate;
      if ("endDate" in payload) $set["residencyStatus.workAuthorization.endDate"] = payload.endDate;
      if ("otherType" in payload) $set["residencyStatus.workAuthorization.otherType"] = payload.otherType;
    }

    if (section === "emergency") {
  
      if (payload.emergencyContact) {
        $set.emergencyContacts = [payload.emergencyContact];
      }
    }

    const updated = await Employee.findOneAndUpdate(
      { user: userId },
      { $set },
      { new: true, runValidators: true }
    ).populate('documents');

    return res.json({ ok: true, data: updated, message: `Updated ${section} successfully.` });
  } catch (err) {
    next(err);
  }
};