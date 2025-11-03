// ============================================
// src/components/common/Card.jsx
// ============================================
const Card = ({ title, subtitle, children, className = '' }) => {
  const classes = ['card', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {title && (
        <header className="card__header">
          <h3 className="card__title">{title}</h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
};

export default Card;
