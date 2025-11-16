export interface CsrfLoadingProps {
  csrfLoading: boolean;
}


export interface ResponseData {
  d: string;
}

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  profile_picture_path?: string;
}
