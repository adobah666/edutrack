'use client';

type ResultTermFilterProps = {
  currentTerm?: string;
};

export default function ResultTermFilter({ currentTerm }: ResultTermFilterProps) {
  return (
    <select
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value !== "ALL") {
          url.searchParams.set("term", e.target.value);
        } else {
          url.searchParams.delete("term");
        }
        url.searchParams.delete("page");
        window.location.href = url.toString();
      }}
      value={currentTerm || "ALL"}
      className="p-2 border rounded"
    >
      <option value="ALL">All Terms</option>
      <option value="FIRST">First Term</option>
      <option value="SECOND">Second Term</option>
      <option value="THIRD">Third Term</option>
      <option value="FINAL">Final Term</option>
    </select>
  );
}
