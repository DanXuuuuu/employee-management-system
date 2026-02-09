import React, { useMemo, useState } from "react";

import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import SelectField from "../components/ui/SelectField";
import Card from "../components/ui/Card";
import SectionNavItem from "../components/ui/SectionNavItem";
import Banner from "../components/ui/Banner";
import Badge from "../components/ui/Badge";

const SECTIONS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment" },
  { key: "emergency", label: "Emergency Contact" },
  { key: "documents", label: "Documents" },
];

export default function PersonalInfo() {
  const [active, setActive] = useState("name");

  // 纯 UI：每个 section 自己的编辑态（后面接 redux 可以保留这个结构）
  const [editing, setEditing] = useState({
    name: false,
    address: false,
    contact: false,
    employment: false,
    emergency: false,
  });

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

  const startEdit = (key) => setEditing((p) => ({ ...p, [key]: true }));

  const cancelEdit = (key) => {
    const ok = window.confirm("Discard all changes?");
    if (!ok) return;
    setEditing((p) => ({ ...p, [key]: false }));
  };

  const saveEdit = (key) => {
    // UI only
    setEditing((p) => ({ ...p, [key]: false }));
  };

  // ✅ 适配你 Button(w-full)：用固定宽度容器 + grid 两列放 Cancel/Save
  const rightActions = (key) => {
    const isEditing = !!editing[key];

    return (
      <div className="w-56">
        {!isEditing ? (
          <Button onClick={() => startEdit(key)}>Edit</Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => cancelEdit(key)}>Cancel</Button>
            <Button onClick={() => saveEdit(key)}>Save</Button>
          </div>
        )}
      </div>
    );
  };

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
                right={
                  <div className="flex items-center gap-3">
                    <Badge variant="default">UI</Badge>
                    {rightActions("name")}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField label="First Name" value="Luna" readOnly={!editing.name} onChange={() => {}} />
                  <TextField label="Last Name" value="Shi" readOnly={!editing.name} onChange={() => {}} />
                  <TextField label="Middle Name" value="" readOnly={!editing.name} onChange={() => {}} />
                  <TextField label="Preferred Name" value="" readOnly={!editing.name} onChange={() => {}} />

                  <div className="md:col-span-2">
                    <TextField label="Profile Picture URL" value="" readOnly={!editing.name} onChange={() => {}} />
                  </div>

                  <div className="md:col-span-2">
                    <TextField label="Email" value="invite-email@example.com" readOnly={!editing.name} onChange={() => {}} />
                  </div>

                  <TextField label="SSN" value="***-**-1234" readOnly={!editing.name} onChange={() => {}} />
                  <TextField label="Date of Birth" type="date" value="2000-01-01" readOnly={!editing.name} onChange={() => {}} />

                  <SelectField
                    label="Gender"
                    value="I do not wish to answer"
                    onChange={() => {}}
                    disabled={!editing.name}
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "I do not wish to answer", label: "I do not wish to answer" },
                    ]}
                  />
                </div>
              </Card>
            )}

            {/* ============ Address ============ */}
            {active === "address" && (
              <Card
                title="Address"
                right={
                  <div className="flex items-center gap-3">
                    <Badge variant="default">UI</Badge>
                    {rightActions("address")}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField label="Building / Apt #" value="" readOnly={!editing.address} onChange={() => {}} />
                  <TextField label="Street" value="123 Main St" readOnly={!editing.address} onChange={() => {}} />
                  <TextField label="City" value="Arcadia" readOnly={!editing.address} onChange={() => {}} />
                  <TextField label="State" value="CA" readOnly={!editing.address} onChange={() => {}} />
                  <TextField label="Zip" value="91007" readOnly={!editing.address} onChange={() => {}} />
                </div>
              </Card>
            )}

            {/* ============ Contact Info ============ */}
            {active === "contact" && (
              <Card
                title="Contact Info"
                right={
                  <div className="flex items-center gap-3">
                    <Badge variant="default">UI</Badge>
                    {rightActions("contact")}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField label="Cell phone" value="123-456-7890" readOnly={!editing.contact} onChange={() => {}} />
                  <TextField label="Work phone" value="" readOnly={!editing.contact} onChange={() => {}} />
                </div>
              </Card>
            )}

            {/* ============ Employment ============ */}
            {active === "employment" && (
              <Card
                title="Employment"
                right={
                  <div className="flex items-center gap-3">
                    <Badge variant="default">UI</Badge>
                    {rightActions("employment")}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Visa title"
                    value="F1(CPT/OPT)"
                    onChange={() => {}}
                    disabled={!editing.employment}
                    options={[
                      { value: "H1-B", label: "H1-B" },
                      { value: "L2", label: "L2" },
                      { value: "F1(CPT/OPT)", label: "F1 (CPT/OPT)" },
                      { value: "H4", label: "H4" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <TextField label="Start date" type="date" value="2025-07-01" readOnly={!editing.employment} onChange={() => {}} />
                  <TextField label="End date" type="date" value="2026-07-01" readOnly={!editing.employment} onChange={() => {}} />
                </div>
              </Card>
            )}

            {/* ============ Emergency Contact ============ */}
            {active === "emergency" && (
              <Card
                title="Emergency Contact"
                right={
                  <div className="flex items-center gap-3">
                    <Badge variant="default">UI</Badge>
                    {rightActions("emergency")}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField label="First Name" value="Jane" readOnly={!editing.emergency} onChange={() => {}} />
                  <TextField label="Last Name" value="Doe" readOnly={!editing.emergency} onChange={() => {}} />
                  <TextField label="Middle Name" value="" readOnly={!editing.emergency} onChange={() => {}} />
                  <TextField label="Phone" value="222-333-4444" readOnly={!editing.emergency} onChange={() => {}} />
                  <TextField label="Email" value="jane@example.com" readOnly={!editing.emergency} onChange={() => {}} />
                  <TextField label="Relationship" value="Friend" readOnly={!editing.emergency} onChange={() => {}} />
                </div>
              </Card>
            )}

            {/* ============ Documents ============ */}
            {active === "documents" && (
              <Card
                title="Documents"
                right={<Badge variant="default">UI</Badge>}
              >
                <div className="space-y-3">
                  {/* list row - UI only */}
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

                      {/* ✅ 适配 Button w-full：每个按钮放 w-32 */}
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
                    <div className="text-sm font-semibold text-slate-900">Upload area (UI only)</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Later we will reuse FileUploadCard and wire document upload/preview/download.
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
