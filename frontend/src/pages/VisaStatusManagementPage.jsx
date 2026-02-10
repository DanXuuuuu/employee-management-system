import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Banner from "../components/ui/Banner";
import FileUploadCard from "../components/ui/FileUploadCard";

import { fetchPersonalInfo } from "../store/personalInfoSlice";
import { fetchMyDocuments, uploadDocument, reuploadDocument } from "../store/documentsSlice";

const DOC_TYPES = {
  OPT_RECEIPT: "OPT Receipt",
  OPT_EAD: "OPT EAD",
  I983: "I-983",
  I20: "I-20",
};

const TEMPLATE_URLS = {
  I983_EMPTY: "/templates/i983.pdf",
};

const normalizeStatus = (s) => {
    if (!s) return "";
    const upper = String(s).trim().toUpperCase();
    if (upper === "PENDING") return "Pending";
    if (upper === "APPROVED") return "Approved";
    if (upper === "REJECTED") return "Rejected";
    return String(s);
  };

const getTopBadge = (status) => {
  if (status === "Pending") return <Badge variant="warning">Pending</Badge>;
  if (status === "Rejected") return <Badge variant="danger">Rejected</Badge>;
  if (status === "Approved") return <Badge variant="success">Approved</Badge>;
  return <Badge variant="default">Not Uploaded</Badge>;
};

export default function VisaStatusManagementPage() {

    const dispatch = useDispatch();

    const personalInfo = useSelector((s) => s.personalInfo);
    const form = personalInfo?.form || {};
    const personalLoading = personalInfo?.status === "loading";

    const documentsState = useSelector((s) => s.documents);
    const documents = documentsState?.items || [];
    const docsLoading = !!documentsState?.loading;
    const uploading = !!documentsState?.uploading;
    const docsError = documentsState?.error || null;

    const [activeStep, setActiveStep] = useState("OPT_RECEIPT");

    useEffect(() => {
        dispatch(fetchPersonalInfo());
        dispatch(fetchMyDocuments());
      }, [dispatch]);


  //  onboarding 里填的 visa type 放在这里，从personal info 拿
  const visaType = form?.residencyStatus?.workAuthorization?.type || "";
  const isOptFlow = visaType === "F1(CPT/OPT)";


  const getDocByType = (type) => (documents || []).find((d) => d.type === type);

  const optReceiptDoc = getDocByType(DOC_TYPES.OPT_RECEIPT);
  const optEadDoc = getDocByType(DOC_TYPES.OPT_EAD);
  const i983Doc = getDocByType(DOC_TYPES.I983);
  const i20Doc = getDocByType(DOC_TYPES.I20);

  const optReceiptStatus = normalizeStatus(optReceiptDoc?.status);
  const optEadStatus = normalizeStatus(optEadDoc?.status);
  const i983Status = normalizeStatus(i983Doc?.status);
  const i20Status = normalizeStatus(i20Doc?.status);

  // 只看 Approved 才能解锁下一步
  const canUploadOptReceipt = true; // F1 onboarding 已提交了 OPT Receipt，
  const canUploadOptEad = optReceiptStatus === "Approved";
  const canUploadI983 = optEadStatus === "Approved";
  const canUploadI20 = i983Status === "Approved";

  // ---- 每一步要显示的 message ----
  const receiptMessage = useMemo(() => {
    if (optReceiptStatus === "Pending") return "Waiting for HR to approve your OPT Receipt.";
    if (optReceiptStatus === "Approved") return "Please upload a copy of your OPT EAD.";
    if (optReceiptStatus === "Rejected") return optReceiptDoc?.feedback || "Your OPT Receipt was rejected. Please check HR feedback.";
    return "Please upload your OPT Receipt (submitted in onboarding application).";
  }, [optReceiptStatus, optReceiptDoc?.feedback]);

  const eadMessage = useMemo(() => {
    if (!canUploadOptEad) return "Please wait until your OPT Receipt is approved.";
    if (optEadStatus === "Pending") return "Waiting for HR to approve your OPT EAD.";
    if (optEadStatus === "Approved") return "Please download and fill out the I-983 form.";
    if (optEadStatus === "Rejected") return optEadDoc?.feedback || "Your OPT EAD was rejected. Please check HR feedback.";
    return "Please upload a copy of your OPT EAD.";
  }, [canUploadOptEad, optEadStatus, optEadDoc?.feedback]);

  const i983Message = useMemo(() => {
    if (!canUploadI983) return "Please wait until your OPT EAD is approved.";
    if (i983Status === "Pending") return "Waiting for HR to approve and sign your I-983.";
    if (i983Status === "Approved") return "Please send the I-983 along with all necessary documents to your school and upload the new I-20.";
    if (i983Status === "Rejected") return i983Doc?.feedback || "Your I-983 was rejected. Please check HR feedback.";
    return "Please download a template, fill it out, and upload your I-983.";
  }, [canUploadI983, i983Status, i983Doc?.feedback]);

  const i20Message = useMemo(() => {
    if (!canUploadI20) return "Please wait until your I-983 is approved.";
    if (i20Status === "Pending") return "Waiting for HR to approve your I-20.";
    if (i20Status === "Approved") return "All documents have been approved.";
    if (i20Status === "Rejected") return i20Doc?.feedback || "Your I-20 was rejected. Please check HR feedback.";
    return "Please upload your new I-20 (after your school issues it).";
  }, [canUploadI20, i20Status, i20Doc?.feedback]);


  const openLink = (url) => () => window.open(url, "_blank", "noopener,noreferrer");

  const handlePick = (type) => async (file) => {
    if (!file) return;

    const existing = getDocByType(type);

    // new type file 首次上传，然后fetch回来display
    if (!existing) {
      const action = await dispatch(uploadDocument({ type, file }));
      if (uploadDocument.fulfilled?.match?.(action)) {
        dispatch(fetchMyDocuments());
      }
      return;
    }

    // 只允许 Rejected 重传
    if (normalizeStatus(existing.status) === "Rejected") {
      const action = await dispatch(reuploadDocument({ id: existing._id, file }));
      if (reuploadDocument.fulfilled?.match?.(action)) {
        dispatch(fetchMyDocuments());
      }
      return;
    }

    alert("This document already exists. Only rejected documents can be re-uploaded.");
  };

  // banner：真实状态下没有 onboardingStatus，就只基于 isOptFlow / loading / errors
  const bannerNode = (() => {
    if (!isOptFlow) {
      return (
        <Banner
          type="info"
          title="Not Applicable"
          message="This page is only for OPT (F1 CPT/OPT). Your current visa type does not require OPT document tracking."
        />
      );
    }

    if (personalLoading || docsLoading) {
      return <Banner type="pending" title="Loading" message="Fetching your visa documents..." />;
    }

    if (docsError) {
      return <Banner type="danger" title="Error" message={String(docsError)} />;
    }

    return (
      <Banner
        type="info"
        title="Visa Status Management"
        message="Track your OPT document status and follow the required next steps in order."
      />
    );
  })();

  if (!isOptFlow) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <div className="text-sm text-slate-500">Dashboard &gt; Visa Status</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="text-xl font-bold text-slate-900">Visa Status Management</div>
              <Badge variant="default">OPT Only</Badge>
            </div>
            <div className="mt-4">{bannerNode}</div>
          </div>

          <Card title="OPT Documents" right={<Badge variant="default">Hidden</Badge>}>
            <div className="text-sm text-slate-600">
              Your visa type is <span className="font-semibold">{visaType || "N/A"}</span>. This page is only shown for{" "}
              <span className="font-semibold">F1(CPT/OPT)</span>.
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Step list UI
  const steps = [
    { key: "OPT_RECEIPT", label: "OPT Receipt", status: optReceiptStatus },
    { key: "OPT_EAD", label: "OPT EAD", status: optEadStatus, locked: !canUploadOptEad },
    { key: "I983", label: "I-983", status: i983Status, locked: !canUploadI983 },
    { key: "I20", label: "I-20", status: i20Status, locked: !canUploadI20 },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div className="text-sm text-slate-500">Dashboard &gt; Visa Status</div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-xl font-bold text-slate-900">Visa Status Management</div>
            <Badge variant="default">OPT Flow</Badge>
            <Badge variant="default">{visaType}</Badge>
            {uploading && <Badge variant="warning">Uploading...</Badge>}
          </div>

          <div className="mt-4">{bannerNode}</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Steps */}
          <div className="col-span-12 md:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">DOCUMENT STEPS</div>

              <div className="mt-3 space-y-2">
                {steps.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveStep(s.key)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      activeStep === s.key ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                      {s.locked ? <Badge variant="default">Locked</Badge> : getTopBadge(s.status)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {s.locked ? "Complete previous step first." : (s.status || "Not Uploaded")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="col-span-12 md:col-span-8 space-y-6">
            {/* STEP 1: OPT Receipt */}
            {activeStep === "OPT_RECEIPT" && (
              <Card title="Step 1 — OPT Receipt" right={getTopBadge(optReceiptStatus)}>
                <div className="text-sm text-slate-700">{receiptMessage}</div>

                <div className="mt-4">
                  <FileUploadCard
                    label="OPT Receipt"
                    required
                    fileName={optReceiptDoc?.fileName || ""}
                    disabled={!canUploadOptReceipt|| uploading}
                    status={optReceiptDoc?.status}
                    feedback={optReceiptDoc?.feedback}
                    onPick={handlePick(DOC_TYPES.OPT_RECEIPT)}
                    onPreview={optReceiptDoc?.fileUrl ? openLink(optReceiptDoc.fileUrl) : undefined}
                    onDownload={optReceiptDoc?.fileUrl ? openLink(optReceiptDoc.fileUrl) : undefined}
                  />
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Next unlock: <span className="font-semibold">OPT EAD</span> (only after HR approves OPT Receipt).
                </div>
              </Card>
            )}

            {/* STEP 2: OPT EAD */}
            {activeStep === "OPT_EAD" && (
              <Card title="Step 2 — OPT EAD" right={canUploadOptEad ? getTopBadge(optEadStatus) : <Badge variant="default">Locked</Badge>}>
                <div className="text-sm text-slate-700">{eadMessage}</div>

                <div className="mt-4">
                  <FileUploadCard
                    label="OPT EAD"
                    required
                    fileName={optEadDoc?.fileName || ""}
                    disabled={!canUploadOptEad || uploading}
                    status={optEadDoc?.status}
                    feedback={optEadDoc?.feedback}
                    onPick={handlePick(DOC_TYPES.OPT_EAD)}
                    onPreview={optEadDoc?.fileUrl ? openLink(optEadDoc.fileUrl) : undefined}
                    onDownload={optEadDoc?.fileUrl ? openLink(optEadDoc.fileUrl) : undefined}
                  />
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Next unlock: <span className="font-semibold">I-983</span> (only after HR approves OPT EAD).
                </div>
              </Card>
            )}

            {/* STEP 3: I-983 */}
            {activeStep === "I983" && (
              <Card title="Step 3 — I-983" right={canUploadI983 ? getTopBadge(i983Status) : <Badge variant="default">Locked</Badge>}>
                <div className="text-sm text-slate-700">{i983Message}</div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">Preview I-983 file</div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={openLink(TEMPLATE_URLS.I983_EMPTY)}
                    >
                      Empty Template
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <FileUploadCard
                    label="I-983 (filled)"
                    required
                    hint="Upload your filled I-983 after OPT EAD is approved."
                    fileName={i983Doc?.fileName || ""}
                    disabled={!canUploadI983}
                    status={i983Doc?.status}
                    feedback={i983Doc?.feedback}
                    onPick={handlePick(DOC_TYPES.I983)}
                    onPreview={i983Doc?.fileUrl ? openLink(i983Doc.fileUrl) : undefined}
                    onDownload={i983Doc?.fileUrl ? openLink(i983Doc.fileUrl) : undefined}
                  />
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Next unlock: <span className="font-semibold">I-20</span> (only after HR approves and signs I-983).
                </div>
              </Card>
            )}

            {/* STEP 4: I-20 */}
            {activeStep === "I20" && (
              <Card title="Step 4 — I-20" right={canUploadI20 ? getTopBadge(i20Status) : <Badge variant="default">Locked</Badge>}>
                <div className="text-sm text-slate-700">{i20Message}</div>

                <div className="mt-4">
                  <FileUploadCard
                    label="I-20"
                    required
                    hint="Upload the updated I-20 issued by your school."
                    fileName={i20Doc?.fileName || ""}
                    disabled={!canUploadI20 || uploading}
                    status={i20Doc?.status}
                    feedback={i20Doc?.feedback}
                    onPick={handlePick(DOC_TYPES.I20)}
                    onPreview={i20Doc?.fileUrl ? openLink(i20Doc.fileUrl) : undefined}
                    onDownload={i20Doc?.fileUrl ? openLink(i20Doc.fileUrl) : undefined}
                  />
                </div>

                {i20Status === "Approved" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-sm font-semibold text-emerald-900">All documents have been approved ✅</div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
