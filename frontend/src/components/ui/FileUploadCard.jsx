export default function FileUploadCard({
    label,
    required = false,
    hint,
    disabled = false,
    fileName,
    onPick,
    onPreview,
    onDownload,
    onRemove,
    status,       // "Pending" | "Approved" | "Rejected"
    feedback,     // string
    uploading,    // boolean
    error,        // string
  }) {
    const badge = (() => {
      if (!status) return null;
      const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold";
      if (status === "Approved") return <span className={`${base} bg-emerald-50 text-emerald-700`}>Approved</span>;
      if (status === "Rejected") return <span className={`${base} bg-rose-50 text-rose-700`}>Rejected</span>;
      return <span className={`${base} bg-amber-50 text-amber-700`}>Pending</span>;
    })();
  
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {label}
                {required && <span className="text-rose-600"> *</span>}
              </div>
              {badge}
              {uploading && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Uploading...
                </span>
              )}
            </div>
  
            {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  
            <div className="mt-1 text-xs text-slate-600">
              {fileName ? `Uploaded: ${fileName}` : "No file uploaded"}
            </div>
  
            {!!feedback && status === "Rejected" && (
              <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <span className="font-semibold">HR feedback:</span> {feedback}
              </div>
            )}
  
            {!!error && (
              <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <span className="font-semibold">Upload error:</span> {error}
              </div>
            )}
          </div>
  
          <div className="flex flex-wrap gap-2">
            {!disabled && (
              <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                {fileName ? "Replace" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => onPick?.(e.target.files?.[0] || null)}
                  disabled={disabled || uploading}
                />
              </label>
            )}
  
            {fileName && (
              <>
                <button
                  type="button"
                  onClick={onPreview}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={onDownload}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Download
                </button>
  
                {!disabled && onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
        </div>
  
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">
          {disabled ? "Read-only mode" : "Upload area"}
        </div>
      </div>
    );
  }
  