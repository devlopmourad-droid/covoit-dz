import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-brand-dark">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-field border px-4 py-3 text-sm text-brand-dark placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${error ? 'border-red-400' : 'border-gray-200'} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
