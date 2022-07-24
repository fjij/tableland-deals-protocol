import React from "react";

interface CodeInputProps {
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  isTextField?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function CodeInput({
  disabled,
  value,
  onChange,
  placeholder,
  label,
}: CodeInputProps) {
  const text = value || "";
  const update = onChange || (() => {});
  return (
    <span>
      {label && (
        <>
          <code>{label}</code>{" "}
        </>
      )}
      <input
        className="code-input"
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: `${
            text.length === 0 ? placeholder?.length || 0 : text.length
          }ch`,
          minWidth: `${placeholder?.length || 0}ch`,
        }}
        value={text}
        onChange={(e) => update(e.target.value)}
      />
    </span>
  );
}
