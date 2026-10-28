
import "./PageHeader.css";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header__content">
        {eyebrow && (
          <p className="page-header__eyebrow">{eyebrow}</p>
        )}

        <h1 className="page-header__title">{title}</h1>

        {subtitle && (
          <p className="page-header__subtitle">{subtitle}</p>
        )}
      </div>

      {action && (
        <div className="page-header__action">
          {action}
        </div>
      )}
    </div>
  );
}
