import Link from "next/link";
export default function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Quorail home">
      <svg
        width="32"
        height="34"
        viewBox="0 0 32 34"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 2 29 9.5v15L16 32 3 24.5v-15L16 2Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="m9 12 7-4 7 4v9l-7 4-7-4v-9Zm8 7 9 9"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>
        quorail<span className="brand-sub">FOR NIMIQ PAY</span>
      </span>
    </Link>
  );
}
