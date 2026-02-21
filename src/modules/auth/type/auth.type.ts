export type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    refreshToken?: string;
  };
};
