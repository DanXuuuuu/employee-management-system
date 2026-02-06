export default function TextField({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    readOnly = false,
  }) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
  
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full rounded-md px-3 py-2 text-sm outline-none
            border
            ${
              readOnly
                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                : "bg-white text-slate-900 border-slate-300 focus:border-blue-600"
            }
          `}
        />
      </div>
    );
  }
  