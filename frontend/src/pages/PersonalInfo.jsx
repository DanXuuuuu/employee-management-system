import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import SelectField from "../components/ui/SelectField";
import Card from "../components/ui/Card";
import SectionNavItem from "../components/ui/SectionNavItem";
import Banner from "../components/ui/Banner";
import Badge from "../components/ui/Badge";

import {
  fetchPersonalInfo,
  savePersonalInfoSection,
  clearPersonalInfoError,
  setField,
  setAddressField,
  setWorkAuthField,
  setEmergencyField,
} from "../store/personalInfoSlice";

const SECTIONS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment" },
  { key: "emergency", label: "Emergency Contact" },
  { key: "documents", label: "Documents" },
];

export default function PersonalInfo() {
  const dispatch = useDispatch();

  const personalInfoState = useSelector((s) => s.personalInfo);

const {
  status = "idle",
  error = null,
  form = {},
  savingSection = null,
  saveError = null,
  saveMessage = "",
} = personalInfoState || {};


  const [active, setActive] = useState("name");

  // 哪个 section 正在编辑（本地状态就够用，不必进 redux）
  const [editing, setEditing] = useState({
    name: false,
    address: false,
    contact: false,
    employment: false,
    emergency: false,
  });



  useEffect(() => {
    dispatch(fetchPersonalInfo());
  }, [dispatch]);

  // 顶部 badge（保持和 onboarding page 视觉一致）
  const pageStatusBadge = useMemo(
    () => <Badge variant="success">Onboarding Completed</Badge>,
    []
  );

  const topReadOnlyBadge = useMemo(
    () => <Badge variant="default">Editable</Badge>,
    []
  );

  const bannerNode = (
    <Banner
      type="success"
      title="Personal Information"
      message="View and update your profile information."
    />
  );

  const startEdit = (key) => {
    // 只允许 5 个 section 进入编辑；documents 是 UI-only
    setEditing((p) => ({ ...p, [key]: true }));
    dispatch(clearPersonalInfoError());
  };

  const cancelEdit = (key) => {
    const ok = window.confirm("Discard all changes?");
    if (!ok) return;

    // 取消编辑：最简单稳妥的方式就是从后端重新拉一次（避免你还要自己做 snapshot 回滚）
    setEditing((p) => ({ ...p, [key]: false }));
    dispatch(fetchPersonalInfo());
  };

  const saveEdit = async (key) => {
    // documents 目前只是展示，不走保存
    if (key === "documents") return;

    const action = await dispatch(savePersonalInfoSection({ section: key }));
    // 保存失败就别退出编辑，方便用户改
    if (savePersonalInfoSection.fulfilled.match(action)) {
      setEditing((p) => ({ ...p, [key]: false }));
    }
  };

  // 右上角按钮组：Edit / Cancel + Save
  const rightActions = (key) => {
    const isEditing = !!editing[key];
    const isSaving = savingSection === key;

    return (
      <div className="w-56">
        {!isEditing ? (
          <Button onClick={() => startEdit(key)}>Edit</Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => cancelEdit(key)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => saveEdit(key)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 小工具：把日期规范成 yyyy-mm-dd 给 input[type=date]
  const toDateValue = (v) => (v ? String(v).slice(0, 10) : "");

  // 现在表单都在 redux：读值的时候做个兜底
  const visaTitle = form?.residencyStatus?.workAuthorization?.type || "F1(CPT/OPT)";
  const otherType = form?.residencyStatus?.workAuthorization?.otherType || "";
  const visaStart = toDateValue(form?.residencyStatus?.workAuthorization?.startDate);
  const visaEnd = toDateValue(form?.residencyStatus?.workAuthorization?.endDate);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top Title / Status（和 OnboardingPage 保持一致） */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div className="text-sm text-slate-500">
            Dashboard &gt; Personal Information
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-xl font-bold text-slate-900">
              Personal Information
            </div>

            {pageStatusBadge}
            {topReadOnlyBadge}

            <div className="ml-auto flex items-center gap-3">
              {status === "loading" && (
                <span className="text-xs font-semibold text-slate-500">
                  Loading...
                </span>
              )}
              {(error || saveError) && (
                <span className="text-xs font-semibold text-rose-600">
                  {String(error || saveError)}
                </span>
              )}
              {saveMessage && (
                <span className="text-xs font-semibold text-emerald-600">
                  {String(saveMessage)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">{bannerNode}</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Nav（和 OnboardingPage 一样） */}
          <div className="col-span-12 md:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                {SECTIONS.map((s) => (
                  <SectionNavItem
                    key={s.key}
                    active={active === s.key}
                    onClick={() => setActive(s.key)}
                  >
                    {s.label}
                  </SectionNavItem>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-12 md:col-span-8 space-y-6">
            {/* ============ Name ============ */}
            {active === "name" && (
              <Card
                title="Name"
                right={<div className="flex items-center gap-3">{rightActions("name")}</div>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="First Name"
                    value={form.firstName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "firstName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Last Name"
                    value={form.lastName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "lastName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Middle Name"
                    value={form.middleName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "middleName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Preferred Name"
                    value={form.preferredName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "preferredName", value: e.target.value }))
                    }
                  />

                  <div className="md:col-span-2">
                    <TextField
                      label="Profile Picture URL"
                      value={form.profilePicture || ""}
                      readOnly={!editing.name}
                      onChange={(e) =>
                        dispatch(setField({ name: "profilePicture", value: e.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextField
                      label="Email"
                      value={form.email || ""}
                      readOnly={!editing.name}
                      onChange={(e) =>
                        dispatch(setField({ name: "email", value: e.target.value }))
                      }
                    />
                  </div>

                  <TextField
                    label="SSN"
                    value={form.ssn || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "ssn", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={toDateValue(form.dob)}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(setField({ name: "dob", value: e.target.value }))
                    }
                  />

                  <SelectField
                    label="Gender"
                    value={form.gender || "I do not wish to answer"}
                    onChange={(e) =>
                      dispatch(setField({ name: "gender", value: e.target.value }))
                    }
                    disabled={!editing.name}
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      {
                        value: "I do not wish to answer",
                        label: "I do not wish to answer",
                      },
                    ]}
                  />
                </div>
              </Card>
            )}

            {/* ============ Address ============ */}
            {active === "address" && (
              <Card
                title="Address"
                right={<div className="flex items-center gap-3">{rightActions("address")}</div>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Building / Apt #"
                    value={form.address?.building || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(setAddressField({ name: "building", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Street"
                    value={form.address?.street || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(setAddressField({ name: "street", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="City"
                    value={form.address?.city || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(setAddressField({ name: "city", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="State"
                    value={form.address?.state || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(setAddressField({ name: "state", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Zip"
                    value={form.address?.zip || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(setAddressField({ name: "zip", value: e.target.value }))
                    }
                  />
                </div>
              </Card>
            )}

            {/* ============ Contact Info ============ */}
            {active === "contact" && (
              <Card
                title="Contact Info"
                right={<div className="flex items-center gap-3">{rightActions("contact")}</div>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Cell phone"
                    value={form.phoneNumber || ""}
                    readOnly={!editing.contact}
                    onChange={(e) =>
                      dispatch(setField({ name: "phoneNumber", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Work phone"
                    value={form.workPhoneNumber || ""}
                    readOnly={!editing.contact}
                    onChange={(e) =>
                      dispatch(setField({ name: "workPhoneNumber", value: e.target.value }))
                    }
                  />
                </div>
              </Card>
            )}

            {/* ============ Employment ============ */}
            {active === "employment" && (
              <Card
                title="Employment"
                right={<div className="flex items-center gap-3">{rightActions("employment")}</div>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Visa title"
                    value={visaTitle}
                    onChange={(e) =>
                      dispatch(setWorkAuthField({ name: "type", value: e.target.value }))
                    }
                    disabled={!editing.employment}
                    options={[
                      { value: "H1-B", label: "H1-B" },
                      { value: "L2", label: "L2" },
                      { value: "F1(CPT/OPT)", label: "F1 (CPT/OPT)" },
                      { value: "H4", label: "H4" },
                      { value: "Other", label: "Other" },
                    ]}
                  />

                  <TextField
                    label="Start date"
                    type="date"
                    value={visaStart}
                    readOnly={!editing.employment}
                    onChange={(e) =>
                      dispatch(setWorkAuthField({ name: "startDate", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="End date"
                    type="date"
                    value={visaEnd}
                    readOnly={!editing.employment}
                    onChange={(e) =>
                      dispatch(setWorkAuthField({ name: "endDate", value: e.target.value }))
                    }
                  />

                  {/* 你后端 employment 支持 otherType，所以这里跟着你现有逻辑：Other 才显示 */}
                  {visaTitle === "Other" && (
                    <div className="md:col-span-2">
                      <TextField
                        label="Specify visa title"
                        value={otherType}
                        readOnly={!editing.employment}
                        onChange={(e) =>
                          dispatch(setWorkAuthField({ name: "otherType", value: e.target.value }))
                        }
                        placeholder="e.g., TN, O-1..."
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ============ Emergency Contact ============ */}
            {active === "emergency" && (
              <Card
                title="Emergency Contact"
                right={<div className="flex items-center gap-3">{rightActions("emergency")}</div>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="First Name"
                    value={form.emergencyContact?.firstName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "firstName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Last Name"
                    value={form.emergencyContact?.lastName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "lastName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Middle Name"
                    value={form.emergencyContact?.middleName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "middleName", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Phone"
                    value={form.emergencyContact?.phone || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "phone", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Email"
                    value={form.emergencyContact?.email || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "email", value: e.target.value }))
                    }
                  />
                  <TextField
                    label="Relationship"
                    value={form.emergencyContact?.relationship || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(setEmergencyField({ name: "relationship", value: e.target.value }))
                    }
                  />
                </div>

                {/* 你之前遇到 required validation，这里给个小提醒（不改功能，只提示） */}
                {!editing.emergency && (
                  <div className="mt-3 text-xs text-slate-500">
                    Tip: Emergency contact fields are required in the Employee schema.
                  </div>
                )}
              </Card>
            )}

            {/* ============ Documents ============ */}
            {active === "documents" && (
              <Card title="Documents">
                <div className="space-y-3">
                  {/* 这里目前还是 UI-only，不碰你的 doc API（后面你要复用 onboarding 的 docs 列表也很容易） */}
                  {[
                    { type: "Driver License", fileName: "driver_license.pdf", status: "Approved" },
                    { type: "Work Authorization", fileName: "work_auth.pdf", status: "Pending" },
                  ].map((d) => (
                    <div
                      key={d.type}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{d.type}</div>
                        <div className="text-xs text-slate-500">{d.fileName}</div>
                        <div className="mt-2 inline-block">
                          <Badge variant="default">{d.status}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <Button onClick={() => {}}>Preview</Button>
                        </div>
                        <div className="w-32">
                          <Button onClick={() => {}}>Download</Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Upload area (UI only)
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Later we can reuse FileUploadCard and wire document upload/preview/download.
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
