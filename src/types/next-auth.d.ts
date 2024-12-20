import { User as NextAuthUser } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User extends NextAuthUser {
    id: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: number;
  }
}
