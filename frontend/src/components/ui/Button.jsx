
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  onClick,
}) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="ui-button__spinner" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
