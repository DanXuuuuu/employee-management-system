export default function Button({ children, disabled, ...rest }) {
    return (
      <button
        disabled={disabled}
        className="w-full rounded-md bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-60"
        {...rest}
      >
        {children}
      </button>
    );
  }
  