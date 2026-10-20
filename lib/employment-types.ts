export const employmentTypeOptions = [
  { value: "intern_unpaid", label: "Magang Unpaid" },
  { value: "intern_paid", label: "Magang Paid" },
  { value: "pkwt", label: "PKWT" },
  { value: "freelance", label: "Freelance" },
  { value: "permanent", label: "Tetap" },
] as const;

export type SelectableEmploymentType =
  (typeof employmentTypeOptions)[number]["value"];

export const employmentTypes = [
  ...employmentTypeOptions.map((option) => option.value),
  "intern",
  "contract",
] as const;

export type EmploymentType = (typeof employmentTypes)[number];

export const employmentTypeLabels: Record<EmploymentType, string> = {
  intern_unpaid: "Magang Unpaid",
  intern_paid: "Magang Paid",
  pkwt: "PKWT",
  freelance: "Freelance",
  permanent: "Tetap",
  intern: "Magang (belum dirinci)",
  contract: "Kontrak (belum dirinci)",
};

export function isSelectableEmploymentType(
  value: string,
): value is SelectableEmploymentType {
  return employmentTypeOptions.some((option) => option.value === value);
}
