import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import SelectField from "../components/ui/SelectField";
import Card from "../components/ui/Card";
import SectionNavItem from "../components/ui/SectionNavItem";
import Banner from "../components/ui/Banner";
import FileUploadCard from "../components/ui/FileUploadCard";
import Badge from "../components/ui/Badge";
import SummaryItem from "../components/ui/SummaryItem";

import {
  fetchOnboarding,
  submitOnboarding,
  uploadDocument,
  reuploadDocument,
  setField,
  setAddressField,
  setResidencyCitizen,
  setResidencyStatusType,
  setWorkAuthField,
} from "../store/onboardingSlice";

const SECTIONS = [
  { key: "personal", label: "Personal Details" },
  { key: "contact", label: "Address & Contact" },
  { key: "identity", label: "Identity" },
  { key: "workAuth", label: "Work Authorization" },
  { key: "refEmergency", label: "Reference & Emergency" },
  { key: "docs", label: "Documents & Summary" },
];

const DOC_TYPES = {
  OPT_RECEIPT: "OPT Receipt",
  OPT_EAD: "OPT EAD",
  I983: "I-983",
  I20: "I-20",
  DRIVER_LICENSE: "Driver License",
  WORK_AUTH: "Work Authorization",
};

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const [active, setActive] = useState("personal");

  const {
    status, // idle | loading | succeeded | failed (page-level)
    error,
    applicationStatus, // NOT_STARTED | PENDING | APPROVED | REJECTED
    hrFeedback,
    documents,
    uploadStatusByType, // { [type]: "idle"|"uploading"|"succeeded"|"failed" }
    uploadErrorByType,
    form,
  } = useSelector((s) => s.onboarding);

  useEffect(() => {
    dispatch(fetchOnboarding());
  }, [dispatch]);

  const isReadOnly =
    applicationStatus === "PENDING" || applicationStatus === "APPROVED";

  const topStatusBadge = useMemo(() => {
    if (applicationStatus === "PENDING") return <Badge variant="warning">Pending</Badge>;
    if (applicationStatus === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
    if (applicationStatus === "APPROVED") return <Badge variant="success">Approved</Badge>;
    return <Badge variant="default">Not Started</Badge>;
  }, [applicationStatus]);

  const topReadOnlyBadge = (
    <Badge variant="default">{isReadOnly ? "Read-only" : "Editable"}</Badge>
  );

  const getDocByType = (type) => (documents || []).find((d) => d.type === type);

  const driverDoc = getDocByType(DOC_TYPES.DRIVER_LICENSE);
  const workAuthDoc = getDocByType(DOC_TYPES.WORK_AUTH);
  const optReceiptDoc = getDocByType(DOC_TYPES.OPT_RECEIPT);

  // ----- derived fields from redux form -----
  const citizenYes = !!form?.residencyStatus?.isCitizenOrPermanentResident;
  const statusType = form?.residencyStatus?.statusType || (citizenYes ? "Citizen" : "No");

  const visaType = form?.residencyStatus?.workAuthorization?.type || "F1(CPT/OPT)";
  const otherVisa = form?.residencyStatus?.workAuthorization?.otherType || "";

  // normalize to yyyy-mm-dd for <input type="date" />
  const startDate = form?.residencyStatus?.workAuthorization?.startDate
    ? String(form.residencyStatus.workAuthorization.startDate).slice(0, 10)
    : "";
  const endDate = form?.residencyStatus?.workAuthorization?.endDate
    ? String(form.residencyStatus.workAuthorization.endDate).slice(0, 10)
    : "";

  // ----- file handlers -----
  const handleDocPick = (type) => (file) => {
    if (!file) return;

    const existing = getDocByType(type);

    // backend rule:
    // - first time: POST /api/documents
    // - reupload: only if status === Rejected -> PUT /api/documents/:id
    if (!existing) {
      dispatch(uploadDocument({ type, file }));
      return;
    }

    if (existing.status !== "Rejected") {
      alert(`This document is ${existing.status}. Only rejected documents can be re-uploaded.`);
      return;
    }

    dispatch(reuploadDocument({ id: existing._id, file }));
  };

  const handlePreview = (doc) => () => {
    if (!doc?.fileUrl) return;
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (doc) => () => {
    if (!doc?.fileUrl) return;
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const onSubmit = () => {
    dispatch(submitOnboarding());
  };

  // ---- banner display ----
  const bannerNode = (() => {
    if (applicationStatus === "PENDING") {
      return (
        <Banner
          type="pending"
          title="Pending"
          message="Please wait for HR to review your application."
        />
      );
    }
    if (applicationStatus === "REJECTED") {
      return (
        <Banner
          type="rejected"
          title="Rejected"
          message={hrFeedback ? `HR Feedback: ${hrFeedback}` : "Your application was rejected. Please resubmit."}
        />
      );
    }
    if (applicationStatus === "APPROVED") {
      return (
        <Banner
          type="success"
          title="Approved"
          message="Your onboarding application has been approved."
        />
      );
    }
    return (
      <Banner
        type="info"
        title="Not Started"
        message="Please complete the onboarding application and submit for review."
      />
    );
  })();

  // ---- small helpers for FileUploadCard ----
  const isUploading = (type) => uploadStatusByType?.[type] === "uploading";
  const uploadErr = (type) => uploadErrorByType?.[type] || "";

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top Title / Status */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div className="text-sm text-slate-500">
            Dashboard &gt; Onboarding Application
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-xl font-bold text-slate-900">
              Onboarding Application
            </div>

            {topStatusBadge}
            {topReadOnlyBadge}

            <div className="ml-auto flex items-center gap-3">
              {status === "loading" && (
                <span className="text-xs font-semibold text-slate-500">Loading...</span>
              )}
              {error && (
                <span className="text-xs font-semibold text-rose-600">
                  {String(error)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">{bannerNode}</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Section Nav */}
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
            {/* ============ Section: Personal ============ */}
            {active === "personal" && (
              <Card title="Personal Details" right={<Badge variant="default">Redux</Badge>}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="First Name *"
                    name="firstName"
                    value={form.firstName || ""}
                    onChange={(e) => dispatch(setField({ name: "firstName", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Last Name *"
                    name="lastName"
                    value={form.lastName || ""}
                    onChange={(e) => dispatch(setField({ name: "lastName", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Middle Name"
                    name="middleName"
                    value={form.middleName || ""}
                    onChange={(e) => dispatch(setField({ name: "middleName", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Preferred Name"
                    name="preferredName"
                    value={form.preferredName || ""}
                    onChange={(e) => dispatch(setField({ name: "preferredName", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />

                  <div className="md:col-span-2">
                    <TextField
                      label="Email (from invite, read-only)"
                      name="email"
                      value={form.email || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>

                  {/* Profile picture: 你后端 documents enum 里没有这个 type，所以暂时纯 UI */}
                  <div className="md:col-span-2">
                    <FileUploadCard
                      label="Profile Picture"
                      hint="UI only (not wired to API)."
                      fileName={form.profilePicture || ""}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* ============ Section: Contact ============ */}
            {active === "contact" && (
              <Card title="Address & Contact" right={<Badge variant="default">Redux</Badge>}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="Building / Apt #"
                    name="building"
                    value={form.address?.building || ""}
                    onChange={(e) => dispatch(setAddressField({ name: "building", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Street Name *"
                    name="street"
                    value={form.address?.street || ""}
                    onChange={(e) => dispatch(setAddressField({ name: "street", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="City *"
                    name="city"
                    value={form.address?.city || ""}
                    onChange={(e) => dispatch(setAddressField({ name: "city", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="State *"
                    name="state"
                    value={form.address?.state || ""}
                    onChange={(e) => dispatch(setAddressField({ name: "state", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Zip *"
                    name="zip"
                    value={form.address?.zip || ""}
                    onChange={(e) => dispatch(setAddressField({ name: "zip", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Cell phone *"
                    name="phoneNumber"
                    value={form.phoneNumber || ""}
                    onChange={(e) => dispatch(setField({ name: "phoneNumber", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Work phone"
                    name="workPhoneNumber"
                    value={form.workPhoneNumber || ""}
                    onChange={(e) => dispatch(setField({ name: "workPhoneNumber", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                </div>
              </Card>
            )}

            {/* ============ Section: Identity ============ */}
            {active === "identity" && (
              <Card title="Identity" right={<Badge variant="default">Redux</Badge>}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label="SSN *"
                    name="ssn"
                    value={form.ssn || ""}
                    onChange={(e) => dispatch(setField({ name: "ssn", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <TextField
                    label="Date of Birth *"
                    name="dob"
                    type="date"
                    value={form.dob ? String(form.dob).slice(0, 10) : ""}
                    onChange={(e) => dispatch(setField({ name: "dob", value: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                  <SelectField
                    label="Gender *"
                    name="gender"
                    value={form.gender || "I do not wish to answer"}
                    onChange={(e) => dispatch(setField({ name: "gender", value: e.target.value }))}
                    disabled={isReadOnly}
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "I do not wish to answer", label: "I do not wish to answer" },
                    ]}
                  />
                </div>
              </Card>
            )}

            {/* ============ Section: Work Authorization ============ */}
            {active === "workAuth" && (
              <Card title="Residency & Work Authorization" right={<Badge variant="default">Redux</Badge>}>
                <div className="space-y-6">
                  {/* citizen / permanent resident */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">
                      Permanent resident or citizen of the U.S.?
                      <span className="ml-1 text-rose-600">*</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className={`flex items-center gap-2 text-sm ${isReadOnly ? "text-slate-400" : "text-slate-700"}`}>
                        <input
                          type="radio"
                          name="citizenChoice"
                          value="YES"
                          checked={citizenYes === true}
                          onChange={() => dispatch(setResidencyCitizen(true))}
                          disabled={isReadOnly}
                        />
                        Yes
                      </label>

                      <label className={`flex items-center gap-2 text-sm ${isReadOnly ? "text-slate-400" : "text-slate-700"}`}>
                        <input
                          type="radio"
                          name="citizenChoice"
                          value="NO"
                          checked={citizenYes === false}
                          onChange={() => dispatch(setResidencyCitizen(false))}
                          disabled={isReadOnly}
                        />
                        No
                      </label>
                    </div>

                    <div className="text-xs text-slate-500">
                      If you select <span className="font-semibold">No</span>, please provide your work authorization details below.
                    </div>
                  </div>

                  {/* YES: citizen/GC */}
                  {citizenYes && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField
                          label="Status type"
                          name="statusType"
                          value={statusType === "No" ? "Citizen" : statusType}
                          onChange={(e) => dispatch(setResidencyStatusType(e.target.value))}
                          disabled={isReadOnly}
                          options={[
                            { value: "Citizen", label: "Citizen" },
                            { value: "Green Card", label: "Green Card" },
                          ]}
                        />

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          Work authorization documents are not required for citizens or permanent residents.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NO: work authorization */}
                  {!citizenYes && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          Work Authorization
                        </div>
                        {isReadOnly && <Badge variant="default">Read-only</Badge>}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField
                          label="Visa type"
                          name="visaType"
                          value={visaType}
                          onChange={(e) => dispatch(setWorkAuthField({ name: "type", value: e.target.value }))}
                          disabled={isReadOnly}
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
                          name="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => dispatch(setWorkAuthField({ name: "startDate", value: e.target.value }))}
                          readOnly={isReadOnly}
                        />
                        <TextField
                          label="End date"
                          name="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => dispatch(setWorkAuthField({ name: "endDate", value: e.target.value }))}
                          readOnly={isReadOnly}
                        />

                        {visaType === "Other" && (
                          <div className="md:col-span-2">
                            <TextField
                              label="Specify visa title"
                              name="otherVisa"
                              value={otherVisa}
                              onChange={(e) => dispatch(setWorkAuthField({ name: "otherType", value: e.target.value }))}
                              placeholder="e.g., TN, O-1..."
                              readOnly={isReadOnly}
                            />
                          </div>
                        )}
                      </div>

                      {/* Upload cards */}
                      <div className="mt-4 space-y-3">
                        <FileUploadCard
                          label="Work Authorization Document "
                          required
                          hint="Upload a PDF or image (blank PDFs are fine for testing)."
                          fileName={workAuthDoc?.fileName || ""}
                          disabled={isReadOnly}
                          status={workAuthDoc?.status}
                          feedback={workAuthDoc?.feedback}
                          uploading={isUploading(DOC_TYPES.WORK_AUTH)}
                          error={uploadErr(DOC_TYPES.WORK_AUTH)}
                          onPick={handleDocPick(DOC_TYPES.WORK_AUTH)}
                          onPreview={handlePreview(workAuthDoc)}
                          onDownload={handleDownload(workAuthDoc)}
                        />

                        {visaType === "F1(CPT/OPT)" && (
                          <FileUploadCard
                            label="OPT Receipt (required for F1 CPT/OPT) "
                            required
                            hint="Upload a PDF (blank PDF is fine for testing)."
                            fileName={optReceiptDoc?.fileName || ""}
                            disabled={isReadOnly}
                            status={optReceiptDoc?.status}
                            feedback={optReceiptDoc?.feedback}
                            uploading={isUploading(DOC_TYPES.OPT_RECEIPT)}
                            error={uploadErr(DOC_TYPES.OPT_RECEIPT)}
                            onPick={handleDocPick(DOC_TYPES.OPT_RECEIPT)}
                            onPreview={handlePreview(optReceiptDoc)}
                            onDownload={handleDownload(optReceiptDoc)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ============ Section: Reference & Emergency ============ */}
            {active === "refEmergency" && (
              <Card title="Reference & Emergency" right={<Badge variant="default">Later</Badge>}>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Reference (UI placeholder)
                  </div>
                  <div className="mt-4 text-xs text-slate-500">
                    You already have emergencyContacts reducers in slice — we can wire this section next.
                  </div>
                </div>
              </Card>
            )}

            {/* ============ Section: Documents & Summary ============ */}
            {active === "docs" && (
              <Card title="Documents & Summary" right={<Badge variant="default">Redux</Badge>}>
                <div className="space-y-3">
                  <FileUploadCard
                    label="Driver’s License "
                    required
                    hint="PDF or image."
                    fileName={driverDoc?.fileName || ""}
                    disabled={isReadOnly}
                    status={driverDoc?.status}
                    feedback={driverDoc?.feedback}
                    uploading={isUploading(DOC_TYPES.DRIVER_LICENSE)}
                    error={uploadErr(DOC_TYPES.DRIVER_LICENSE)}
                    onPick={handleDocPick(DOC_TYPES.DRIVER_LICENSE)}
                    onPreview={handlePreview(driverDoc)}
                    onDownload={handleDownload(driverDoc)}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Summary
                  </div>

                  <div className="mt-3 space-y-2">
                    <SummaryItem
                      label="First name"
                      status={form.firstName ? "ok" : "missing"}
                      value={form.firstName || ""}
                    />
                    <SummaryItem
                      label="Last name"
                      status={form.lastName ? "ok" : "missing"}
                      value={form.lastName || ""}
                    />
                    <SummaryItem
                      label="Driver’s License"
                      status={driverDoc?.fileName ? "ok" : "missing"}
                      value={driverDoc?.fileName || ""}
                    />
                    <SummaryItem
                      label="Work Authorization"
                      status={citizenYes ? "info" : (workAuthDoc?.fileName ? "ok" : "missing")}
                      value={citizenYes ? "Not required" : (workAuthDoc?.fileName || "")}
                    />
                    <SummaryItem
                      label="OPT Receipt (if F1)"
                      status={
                        visaType === "F1(CPT/OPT)"
                          ? (optReceiptDoc?.fileName ? "ok" : "missing")
                          : "info"
                      }
                      value={
                        visaType === "F1(CPT/OPT)"
                          ? (optReceiptDoc?.fileName || "")
                          : "Not required"
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Button
                      disabled={isReadOnly || applicationStatus === "APPROVED" || status === "loading"}
                      onClick={onSubmit}
                    >
                      {applicationStatus === "REJECTED" ? "Resubmit Application" : "Submit Application"}
                    </Button>

                    <div className="mt-2 text-xs text-slate-500">
                      Status: <span className="font-semibold">{applicationStatus}</span>
                      {status === "loading" && <span className="ml-2">(working...)</span>}
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
