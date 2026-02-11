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

import {
  fetchMyDocuments,
  uploadDocument,
  reuploadDocument,
} from "../store/documentsSlice";

/**
 * 左侧导航
 * - documents 放在最后，逻辑更符合用户看信息的顺序
 */
const SECTIONS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment" },
  { key: "emergency", label: "Emergency Contact" },
  { key: "documents", label: "Documents" },
];


const DOC_TYPES = {
  DRIVER_LICENSE: "Driver License",
  WORK_AUTH: "Work Authorization",
};

export default function PersonalInfo() {
  const dispatch = useDispatch();

  // Redux State
  const personalInfoState = useSelector((s) => s.personalInfo);
  const {
    status = "idle",
    error = null,
    form = {},
    savingSection = null,
    saveError = null,
    saveMessage = "",
  } = personalInfoState || {};

  const documentsState = useSelector((s) => s.documents);
  const docs = documentsState?.items || [];
  const docsLoading = !!documentsState?.loading;
  const docsUploading = !!documentsState?.uploading;
  const docsError = documentsState?.error || null;


  // Local UI State
 
  const [active, setActive] = useState("name");
  const [editing, setEditing] = useState({
    name: false,
    address: false,
    contact: false,
    employment: false,
    emergency: false,
  });


  useEffect(() => {
    // 页面进入：拿 employee 的 profile 信息
    dispatch(fetchPersonalInfo());

    // 页面进入：拿当前登录用户的 documents（
    dispatch(fetchMyDocuments());
  }, [dispatch]);

  // 顶部 badge（保持和 onboarding page 一致）
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

  // Helper functions

  // 日期转成 yyyy-mm-dd，给 input[type=date] 用
  const toDateValue = (v) => (v ? String(v).slice(0, 10) : "");

  // documents: 找某个 type 的 doc
  const getDocByType = (type) => docs.find((d) => d.type === type);

  // documents: 统一 status 显示
  const normalizeDocStatus = (s) => {
    if (!s) return "";
    const u = String(s).trim().toUpperCase();
    if (u === "PENDING") return "Pending";
    if (u === "APPROVED") return "Approved";
    if (u === "REJECTED") return "Rejected";
    return String(s);
  };
 // documents badge 颜色
  const docBadgeVariant = (status) => {
    const s = normalizeDocStatus(status);
    if (s === "Approved") return "success";
    if (s === "Rejected") return "danger";
    if (s === "Pending") return "warning";
    return "default";
  };

  // 打开文件链接 预览/下载
  const handlePreview = (doc) => () => {
    if (!doc?.fileUrl) return;

    const fullUrl = `http://localhost:8080${doc.fileUrl}`; 
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (doc) => () => {
  if (!doc?.fileUrl) return;

  const fullUrl = `http://localhost:8080${doc.fileUrl}`;
 
  const link = document.createElement('a');
  link.href = fullUrl;

  link.setAttribute('download', `${doc.type.replace(/\s+/g, '_')}_${doc.fileName}`);
  
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
};



  const startEdit = (key) => {
    // documents 是单独资源，不走 personalInfo save
    setEditing((p) => ({ ...p, [key]: true }));
    dispatch(clearPersonalInfoError());
  };

  const cancelEdit = (key) => {
    const ok = window.confirm("Discard all changes?");
    if (!ok) return;

    // 取消编辑 - 重新拉一次后端data
    setEditing((p) => ({ ...p, [key]: false }));
    dispatch(fetchPersonalInfo());
  };

  const saveEdit = async (key) => {
    // documents 不走 personalInfo 保存
    if (key === "documents") return;

    const action = await dispatch(savePersonalInfoSection({ section: key }));

    // 保存成功才退出编辑
    if (savePersonalInfoSection.fulfilled.match(action)) {
      setEditing((p) => ({ ...p, [key]: false }));
    }
  };

  // Card 右上角按钮：Edit / Cancel+Save
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

  /**
   * documents 上传逻辑：
   * - 没有这个 type：走 upload
   * - 有这个 type 且被 Reject：走 reupload（后端也要求必须 Rejected 才能 PUT）
   * - 其他状态：不允许重复上传
   */
  const handlePickDoc = (type) => async (file) => {
    if (!file) return;

    const existing = getDocByType(type);
    const existingStatus = normalizeDocStatus(existing?.status);

    // 没有就 POST 创建
    if (!existing) {
      const action = await dispatch(uploadDocument({ type, file }));
      if (uploadDocument.fulfilled.match(action)) {
        dispatch(fetchMyDocuments());
      }
      return;
    }

    // Rejected 才允许 PUT 重新上传
    if (existingStatus === "Rejected") {
      const action = await dispatch(
        reuploadDocument({ id: existing._id, file })
      );
      if (reuploadDocument.fulfilled.match(action)) {
        dispatch(fetchMyDocuments());
      }
      return;
    }

    // 其他状态不允许重复传
    alert("This document already exists. Only rejected documents can be re-uploaded.");
  };


  // 从 redux form 里取 visa 信息（给 employment section）
  const visaTitle =
    form?.residencyStatus?.workAuthorization?.type || "F1(CPT/OPT)";
  const otherType = form?.residencyStatus?.workAuthorization?.otherType || "";
  const visaStart = toDateValue(
    form?.residencyStatus?.workAuthorization?.startDate
  );
  const visaEnd = toDateValue(
    form?.residencyStatus?.workAuthorization?.endDate
  );

  const driverLicenseDoc = getDocByType(DOC_TYPES.DRIVER_LICENSE);
  const workAuthDoc = getDocByType(DOC_TYPES.WORK_AUTH);

  const driverStatus = normalizeDocStatus(driverLicenseDoc?.status);
  const workAuthStatus = normalizeDocStatus(workAuthDoc?.status);

  // disabled 规则：上传中禁用；已有且不是 Rejected 禁用
  const disableDriverUpload =
    docsUploading || (driverLicenseDoc && driverStatus !== "Rejected");
  const disableWorkAuthUpload =
    docsUploading || (workAuthDoc && workAuthStatus !== "Rejected");



  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
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
          {/* Left Nav */}
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
              <Card title="Name" right={rightActions("name")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="First Name"
                    value={form.firstName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(
                        setField({ name: "firstName", value: e.target.value })
                      )
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
                      dispatch(
                        setField({ name: "middleName", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="Preferred Name"
                    value={form.preferredName || ""}
                    readOnly={!editing.name}
                    onChange={(e) =>
                      dispatch(
                        setField({ name: "preferredName", value: e.target.value })
                      )
                    }
                  />

                  <div className="md:col-span-2">
                    <TextField
                      label="Profile Picture URL"
                      value={form.profilePicture || ""}
                      readOnly={!editing.name}
                      onChange={(e) =>
                        dispatch(
                          setField({
                            name: "profilePicture",
                            value: e.target.value,
                          })
                        )
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
              <Card title="Address" right={rightActions("address")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Building / Apt #"
                    value={form.address?.building || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(
                        setAddressField({
                          name: "building",
                          value: e.target.value,
                        })
                      )
                    }
                  />
                  <TextField
                    label="Street"
                    value={form.address?.street || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(
                        setAddressField({ name: "street", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="City"
                    value={form.address?.city || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(
                        setAddressField({ name: "city", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="State"
                    value={form.address?.state || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(
                        setAddressField({ name: "state", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="Zip"
                    value={form.address?.zip || ""}
                    readOnly={!editing.address}
                    onChange={(e) =>
                      dispatch(
                        setAddressField({ name: "zip", value: e.target.value })
                      )
                    }
                  />
                </div>
              </Card>
            )}

            {/* ============ Contact Info ============ */}
            {active === "contact" && (
              <Card title="Contact Info" right={rightActions("contact")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Cell phone"
                    value={form.phoneNumber || ""}
                    readOnly={!editing.contact}
                    onChange={(e) =>
                      dispatch(
                        setField({ name: "phoneNumber", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="Work phone"
                    value={form.workPhoneNumber || ""}
                    readOnly={!editing.contact}
                    onChange={(e) =>
                      dispatch(
                        setField({
                          name: "workPhoneNumber",
                          value: e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </Card>
            )}

            {/* ============ Employment ============ */}
            {active === "employment" && (
              <Card title="Employment" right={rightActions("employment")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Visa title"
                    value={visaTitle}
                    onChange={(e) =>
                      dispatch(
                        setWorkAuthField({ name: "type", value: e.target.value })
                      )
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
                      dispatch(
                        setWorkAuthField({
                          name: "startDate",
                          value: e.target.value,
                        })
                      )
                    }
                  />
                  <TextField
                    label="End date"
                    type="date"
                    value={visaEnd}
                    readOnly={!editing.employment}
                    onChange={(e) =>
                      dispatch(
                        setWorkAuthField({
                          name: "endDate",
                          value: e.target.value,
                        })
                      )
                    }
                  />

                  {visaTitle === "Other" && (
                    <div className="md:col-span-2">
                      <TextField
                        label="Specify visa title"
                        value={otherType}
                        readOnly={!editing.employment}
                        onChange={(e) =>
                          dispatch(
                            setWorkAuthField({
                              name: "otherType",
                              value: e.target.value,
                            })
                          )
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
              <Card title="Emergency Contact" right={rightActions("emergency")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="First Name"
                    value={form.emergencyContact?.firstName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(
                        setEmergencyField({
                          name: "firstName",
                          value: e.target.value,
                        })
                      )
                    }
                  />
                  <TextField
                    label="Last Name"
                    value={form.emergencyContact?.lastName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(
                        setEmergencyField({ name: "lastName", value: e.target.value })
                      )
                    }
                  />
                  <TextField
                    label="Middle Name"
                    value={form.emergencyContact?.middleName || ""}
                    readOnly={!editing.emergency}
                    onChange={(e) =>
                      dispatch(
                        setEmergencyField({
                          name: "middleName",
                          value: e.target.value,
                        })
                      )
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
                      dispatch(
                        setEmergencyField({
                          name: "relationship",
                          value: e.target.value,
                        })
                      )
                    }
                  />
                </div>

              </Card>
            )}

            {/* ============ Documents ============ */}
            {active === "documents" && (
              <Card
                title="Documents"
                right={
                  <div className="flex items-center gap-2">
                    {docsLoading && <Badge variant="warning">Loading...</Badge>}
                    {docsUploading && <Badge variant="warning">Uploading...</Badge>}
                    {docsError && <Badge variant="danger">Error</Badge>}
                  </div>
                }
              >
                <div className="space-y-4">
                  {docsError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {String(docsError)}
                    </div>
                  )}

                  {/* All uploaded file */}
                  {docs.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        All uploaded files
                      </div>

                      <div className="mt-3 space-y-2">
                        {docs.map((d) => (
                          <div
                            key={d._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {d.type}
                              </div>
                              <div className="text-xs text-slate-500">
                                {d.fileName || "—"}
                              </div>
                              <div className="mt-2 inline-block">
                                <Badge variant={docBadgeVariant(d.status)}>
                                  {normalizeDocStatus(d.status) || "Not Uploaded"}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-32">
                                <Button
                                  disabled={!d.fileUrl}
                                  onClick={handlePreview(d)}
                                >
                                  Preview
                                </Button>
                              </div>
                              <div className="w-32">
                                <Button
                                  disabled={!d.fileUrl}
                                  onClick={handleDownload(d)}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        Note: Only rejected documents can be re-uploaded.
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
