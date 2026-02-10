const Employee = require("../models/Employee");

/**
 * GET /api/personal-info
 * - onboarding 已完成
 * - employee 必须存在
 */
exports.getPersonalInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({
        ok: false,
        message: "Employee profile not found. Please complete onboarding first.",
      });
    }

    const obj = employee.toObject();
    return res.json({ ok: true, data: obj });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/personal-info/:section
 * - 允许用户分段保存
 */
exports.updatePersonalInfoSection = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { section } = req.params;
    const payload = req.body || {};

    const allowed = new Set(["name", "address", "contact", "employment", "emergency", "reference"]);
    if (!allowed.has(section)) {
      return res.status(400).json({ ok: false, message: "Invalid section" });
    }

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({
        ok: false,
        message: "Employee profile not found. Please complete onboarding first.",
      });
    }

    const $set = {};

    if (section === "name") {
      if ("firstName" in payload) $set.firstName = payload.firstName;
      if ("lastName" in payload) $set.lastName = payload.lastName;
      if ("middleName" in payload) $set.middleName = payload.middleName;
      if ("preferredName" in payload) $set.preferredName = payload.preferredName;

      if ("profilePicture" in payload) $set.profilePicture = payload.profilePicture;
      if ("email" in payload) $set.email = payload.email;

      if ("ssn" in payload) $set.ssn = payload.ssn;
      if ("dob" in payload) $set.dob = payload.dob;
      if ("gender" in payload) $set.gender = payload.gender;
    }

    if (section === "address") {
      if ("building" in payload) $set["address.building"] = payload.building;
      if ("street" in payload) $set["address.street"] = payload.street;
      if ("city" in payload) $set["address.city"] = payload.city;
      if ("state" in payload) $set["address.state"] = payload.state;
      if ("zip" in payload) $set["address.zip"] = payload.zip;
    }

    if (section === "contact") {
      if ("phoneNumber" in payload) $set.phoneNumber = payload.phoneNumber;
      if ("workPhoneNumber" in payload) $set.workPhoneNumber = payload.workPhoneNumber;
    }

    if (section === "employment") {
      // 你的需求是 Visa title/start/end
      // schema 映射到 residencyStatus.workAuthorization
      // 前端 payload 推荐传：
      // { visaTitle, startDate, endDate, otherType? }
      if ("visaTitle" in payload) $set["residencyStatus.workAuthorization.type"] = payload.visaTitle;
      if ("otherType" in payload) $set["residencyStatus.workAuthorization.otherType"] = payload.otherType;
      if ("startDate" in payload) $set["residencyStatus.workAuthorization.startDate"] = payload.startDate;
      if ("endDate" in payload) $set["residencyStatus.workAuthorization.endDate"] = payload.endDate;
    }

    if (section === "reference") {
      for (const k of ["firstName", "lastName", "middleName", "phone", "email", "relationship"]) {
        if (k in payload) $set[`reference.${k}`] = payload[k];
      }
    }

    if (section === "emergency") {
      // 你需求是“Emergency contact”（单个）
      // 但 schema 是 emergencyContacts[]（数组）
      // 我们约定：前端传一个对象 emergencyContact，后端写入到 emergencyContacts[0]
      // payload: { emergencyContact: { firstName, lastName, ... } }
      const ec = payload.emergencyContact;
      if (!ec || typeof ec !== "object") {
        return res.status(400).json({
          ok: false,
          message: "Expected { emergencyContact: {...} }",
        });
      }

      // 直接替换数组第一项（简单直观）
      $set.emergencyContacts = [ec];
    }

    await Employee.updateOne({ user: userId }, { $set });

    const updated = await Employee.findOne({ user: userId });
    const obj = updated.toObject();

    return res.json({ ok: true, data: obj, message: `Updated ${section}.` });
  } catch (err) {
    next(err);
  }
};
