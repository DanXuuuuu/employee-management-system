export default function SelectField({
    label,
    name,
    value,
    onChange,
    options = [],
    disabled = false,
  }) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
  
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-md px-3 py-2 text-sm outline-none border
            ${
              disabled
                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                : "bg-white text-slate-900 border-slate-300 focus:border-blue-600"
            }
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  