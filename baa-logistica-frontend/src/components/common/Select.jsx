// ============================================
// src/components/common/Select.jsx
// ============================================
const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error = '',
  className = '',
  placeholder = 'Selecione uma opção',
  ...rest
}) => {
  const wrapperClass = ['form-field', className].filter(Boolean).join(' ');
  const controlClass = ['form-field__control', error ? 'form-field__control--error' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={name} className="form-field__label">
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={controlClass}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
};

export default Select;
