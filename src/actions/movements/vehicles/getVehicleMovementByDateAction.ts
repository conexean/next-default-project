'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const getVehicleMovementSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inicial inválida',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data final inválida',
  }),
});

export async function getVehicleMovementByDateAction(
  startDate: string,
  endDate: string,
) {
  try {

    const validatedData = getVehicleMovementSchema.parse({
      startDate,
      endDate,
    });

    const startDateTime = new Date(validatedData.startDate);
    const endDateTime = new Date(validatedData.endDate);

    endDateTime.setHours(23, 59, 59, 999);

    const movements = await prisma.vehicleMovement.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      select: {
        action: true,
        createdAt: true,
        vehicle: {
          select: {
            licensePlate: true,
            carModel: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedMovements = movements.map((movement) => ({
      licensePlate: movement.vehicle.licensePlate,
      carModel: movement.vehicle.carModel,
      companyName: movement.vehicle.company.name,
      action: movement.action,
      date: movement.createdAt.toISOString(),
    }));

    revalidatePath('/historical');

    return {
      success: true,
      message: 'Movimentações listadas com sucesso',
      data: formattedMovements,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      };
    }

    return {
      success: false,
      message: 'Ocorreu um erro ao listar movimentações',
    };
  }
}
