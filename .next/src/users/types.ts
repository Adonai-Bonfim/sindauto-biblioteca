export type LibraryUser = {
  id: string;
  phone: string;
  isAdmin: boolean;
  user_metadata: { name: string; first_name: string; last_name: string; department: string };
};
