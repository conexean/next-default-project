import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { Permission } from '@prisma/client';

type ServerAction<T = any> = (...args: any[]) => Promise<T>;

interface UserPayload {
  email: string;
  fullName: string;
  companyId: string;
  permissions: Array<{ module: string; permission: Permission }>;
  exp: number;
  iat: number;
  nbf: number;
}
export function withPermissions(requiredModule: string, requiredPermission: Permission, action: ServerAction) {
  return async (...args: unknown[]) => {
    const token = cookies().get(auth.getTokenName())?.value;
    if (!token) {
      throw new Error('Token não fornecido');
    }
    const payload = await auth.verifyToken(token) as unknown as UserPayload | null;
    if (!payload) {
      throw new Error('Token inválido');
    }
    const hasPermission = payload.permissions.some(
      p => p.module === requiredModule && p.permission === requiredPermission
    );
    if (!hasPermission) {
      throw new Error('Permissão negada');
    }

    return action(...args);
  };
}