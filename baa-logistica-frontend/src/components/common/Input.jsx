// ============================================
// src/components/common/Input.jsx
// ============================================
const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  className = '',
  ...rest
}) => {
  const wrapperClass = ['form-field', className].filter(Boolean).join(' ');
  const controlClass = ['form-field__control', error ? 'form-field__control--error' : '']
    .filter(Boolean)
    .join(' ');

  const isFileInput = type === 'file';
  const inputProps = {
    type,
    id: name,
    name,
    onChange,
    placeholder,
    required,
    className: controlClass,
    ...rest
  };

  if (!isFileInput) {
    inputProps.value = value ?? '';
  }

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={name} className="form-field__label">
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      <input {...inputProps} />
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
};

export default Input;
