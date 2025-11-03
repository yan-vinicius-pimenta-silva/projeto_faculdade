// ============================================
// src/components/common/Button.jsx
// ============================================
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    danger: 'btn--danger',
    success: 'btn--success',
    outline: 'btn--outline',
  };

  const sizes = {
    sm: 'btn--sm',
    md: 'btn--md',
    lg: 'btn--lg',
  };

  const classes = [
    'btn',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    disabled ? 'is-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default Button;
