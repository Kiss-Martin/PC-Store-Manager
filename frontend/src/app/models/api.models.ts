export interface User {
  id: string;
  email: string;
  username: string;
  fullname?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  access_token?: string;
}
