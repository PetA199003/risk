import NextAuth, { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

// Define UserRole enum locally since we can't import from Prisma
export enum UserRole {
  ADMIN = 'ADMIN',
  PROJEKTLEITER = 'PROJEKTLEITER',
  MITARBEITER = 'MITARBEITER'
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
  interface User {
    role: UserRole;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Fallback authentication without database
        const testUsers = [
          { id: '1', email: 'admin@gbu-app.de', password: 'admin123', name: 'System Administrator', role: UserRole.ADMIN },
          { id: '2', email: 'projektleiter@gbu-app.de', password: 'user123', name: 'Max Mustermann', role: UserRole.PROJEKTLEITER },
          { id: '3', email: 'mitarbeiter@gbu-app.de', password: 'user123', name: 'Lisa Musterfrau', role: UserRole.MITARBEITER },
        ];
        
        const user = testUsers.find(u => u.email === credentials.email);
        if (user && user.password === credentials.password) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
});