export type GoogleUser = {
  id: string;
  email: string;
  /** Google confirmed the user owns the address. Pending invites require it. */
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  picture: string;
};
