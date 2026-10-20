export type EmployeeActionState = {
  success: boolean;
  message: string;
};

export const initialEmployeeActionState: EmployeeActionState = {
  success: false,
  message: "",
};
