const Employee = require("../models/Employee");
const Document = require("../models/Document");

/**
 * GET /api/onboarding
 * Minimal contract:
 * - If employee not found: return status NOT_STARTED, employee null
 * - Always return documents array (may be empty)
 */
exports.getOnboarding = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const employee = await Employee.findOne({ user: userId });
    const documents = await Document.find({ owner: userId })
      .sort({ createdAt: -1 })
      .select("_id type status feedback fileUrl fileKey fileName createdAt updatedAt");

    // employee 可能不存在（Not Started）
    const status = employee?.applicationStatus || "NOT_STARTED";
    const hrFeedback = employee?.hrFeedback || "";

    return res.json({
      ok: true,
      data: {
        status,
        hrFeedback,
        employee: employee ? employee.toObject() : null,
        documents: documents.map((d) => d.toObject())
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/onboarding/submit
 * - 允许：NOT_STARTED / REJECTED / employee 不存在
 * - 禁止：PENDING / APPROVED
 * - 行为：保存 employee payload，然后状态设为 PENDING，清空 hrFeedback
 *
 * Body: { employee: {...} }
 */
exports.submitOnboarding = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const payload = req.body?.employee;
  
      if (!payload) {
        return res.status(400).json({
          ok: false,
          message: "Missing employee payload. Expected { employee: {...} }",
        });
      }
  
      let employee = await Employee.findOne({ user: userId });
      const currentStatus = employee?.applicationStatus || "NOT_STARTED";
  
      // 状态 gate
      if (currentStatus === "PENDING") {
        return res.status(409).json({ ok: false, message: "Already pending." });
      }
      if (currentStatus === "APPROVED") {
        return res.status(409).json({ ok: false, message: "Already approved." });
      }
  
      // email 锁死：来自 employee（已存在）或登录用户（如果你 auth 有 email）
      const lockedEmail = employee?.email || req.user.email;
      if (!lockedEmail) {
        return res.status(400).json({
          ok: false,
          message: "Invite email is missing. Cannot submit onboarding.",
        });
      }
  
      // create or update
      if (!employee) {
        employee = await Employee.create({
          ...payload,
          user: userId,
          email: lockedEmail,
          applicationStatus: "PENDING",
          hrFeedback: "",
        });
      } else {
        employee.set({
          ...payload,
          user: userId,
          email: lockedEmail,
          applicationStatus: "PENDING",
          hrFeedback: "",
        });
        await employee.save();
      }
  
      return res.status(200).json({
        ok: true,
        data: {
          status: employee.applicationStatus,
          hrFeedback: employee.hrFeedback || "",
          employee: employee.toObject(),
        },
        message: "Submitted. Status set to PENDING.",
      });
    } catch (err) {
      next(err);
    }
  };