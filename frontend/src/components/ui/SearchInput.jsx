
import { Search, X } from "lucide-react";
import "./SearchInput.css";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
}) {
  return (
    <div className="ui-search">
      <Search
        className="ui-search__icon"
        size={18}
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />

      {value && (
        <button
          type="button"
          className="ui-search__clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
