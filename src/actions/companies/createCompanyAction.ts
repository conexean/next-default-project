'use server';

import { AppError } from '@/error/appError';
import { prisma } from '../../lib/prisma';
import {
  CompanyFormData,
  companyFormSchema,
} from '../../schemas/companySchema';
import { removeCnpjMask } from '../../utils/cnpjUtils';
import { revalidatePath } from 'next/cache';
import { MESSAGE } from '@/utils/message';
import { withPermissions } from '@/middleware/serverActionAuthorizationMiddleware';
import { handleErrors } from '@/utils/handleErrors';
import { Prisma } from '@prisma/client';

export interface ICreateCompanyReturnProps {
  success: boolean;
  data?: string;
  error?: string;
}

export const createCompanyAction = withPermissions(
  'companies',
  'WRITE',
  async (data: CompanyFormData): Promise<ICreateCompanyReturnProps> => {
    try {
      const validatedData = companyFormSchema.parse(data);

      const { name, cnpj } = validatedData;

      const cleanCnpj = removeCnpjMask(cnpj);

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existingCompany = await tx.company.findUnique({
          where: { cnpj: cleanCnpj },
        });

        if (existingCompany) {
          throw new AppError(MESSAGE.COMPANY.EXISTING_CNPJ, 409);
        }

        await tx.company.create({
          data: {
            name,
            cnpj: cleanCnpj,
          },
        });

        return MESSAGE.COMPANY.CREATED_SUCCESS;
      });

      revalidatePath('/companies');
      return { success: true, data: result };
    } catch (error) {
      const errorResult = handleErrors(error);
      return { success: false, error: errorResult.error };
    }
  },
);
