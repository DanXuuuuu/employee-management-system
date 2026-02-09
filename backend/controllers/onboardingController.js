const Employee = require("../models/Employee");

/**
 * GET /api/onboarding
 */
exports.getOnboarding = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email; // 从 JWT 获取原始 email

        const employee = await Employee.findOne({ user: userId }).populate('documents');

        // 计算状态
        let status = "Never Submitted";
        if (employee) status = employee.applicationStatus;

        res.status(200).json({
            ok: true,
            data: {
                status,
                hrFeedback: employee ? employee.hrFeedback : "",
                // 如果是第一次进入，返回一个带有 email 的空对象供前端渲染
                employee: employee || { email: userEmail }, 
                documents: employee ? employee.documents : []
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/onboarding/submit
 */
exports.submitOnboarding = async (req, res, next) => {
    try {
        const { employee } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email; // 获取可靠的 email 源

        if (!employee) {
            return res.status(400).json({ ok: false, message: "No data provided" });
        }

        // 状态检查逻辑保持不变...
        const existing = await Employee.findOne({ user: userId });
        if (existing && (existing.applicationStatus === 'PENDING' || existing.applicationStatus === 'APPROVED')) {
            return res.status(403).json({ ok: false, message: "Forbidden: Status is Pending or Approved" });
        }

        // 核心修复：构造数据，强制补齐 email 和 user ID
        const updateData = {
            ...employee,
            user: userId,
            email: userEmail, // 解决 "email is required" 验证报错
            applicationStatus: 'PENDING',
            hrFeedback: '',
            lastUpdated: Date.now()
        };

        const updatedEmployee = await Employee.findOneAndUpdate(
            { user: userId },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            ok: true,
            data: {
                status: updatedEmployee.applicationStatus,
                hrFeedback: updatedEmployee.hrFeedback,
                employee: updatedEmployee
            }
        });
    } catch (error) {
        console.error("Submit Error Details:", error.message);
        next(error);
    }
};