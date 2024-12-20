import { z } from 'zod';
import { idSchema } from './idSchema';
import { observationSchema } from './observationSchema';

export const employeeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Nome deve conter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome não pode exceder 100 caracteres' }),
  registration: z
    .string()
    .min(2, { message: 'Matrícula deve conter pelo menos 2 caracteres' })
    .max(20, { message: 'Matrícula não pode exceder 20 caracteres' }),
  internalPassword: z
    .string()
    .max(20, { message: 'Senha interna não pode exceder 20 caracteres' })
    .optional(),
  telephone: z
    .string()
    .max(15, { message: 'Telefone deve conter 10 caracteres' })
    .optional(),
  cellPhone: z
    .string()
    .max(15, { message: 'Celular deve conter 11 caracteres' })
    .optional(),
  observation: observationSchema,
  photoURL: z
    .string()
    .max(200, { message: 'URL da imagem não pode exceder 200 caracteres' })
    .optional(),
  companyIds: z
    .array(idSchema)
    .min(1, { message: 'É necessário informar pelo menos 1 empresa' }),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
