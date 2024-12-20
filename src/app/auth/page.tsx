'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { LoginFormData, loginFormSchema } from '@/schemas/loginSchema';
import Image from 'next/image';
import { loginUserAction } from '@/actions/auth/login';
import { toast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/context/loadingContext';

export default function Page() {
  const router = useRouter();
  const { isLoading, setIsLoading } = useLoading();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormData) {
    setIsLoading(true);
    const response = await loginUserAction(values);

    // /**
    //  * Se a resposta for positiva, eu verifico as permissões do usuário.
    //  * Após identificar as permissões, faço o redirecionamento para o
    //  * primeiro módulo que tiver a permissão READ ou ADMIN.
    //  *
    //  * Caso não tenha nenhum módulo com permissão de administrador ou leitura,
    //  * faço o redirecionamento para a rota de não autorizado.
    //  */

    if (response.success) {
      const permissions = response.data.permissions;
      const firstReadModule = permissions.find(
        (item) => item.permission === 'READ' || item.permission === 'ADMIN',
      );

      if (firstReadModule) {
        router.push(`/${firstReadModule.module}`);
      } else {
        router.push('/unauthorized');
      }

      setIsLoading(false);
    } else {
      toast({
        variant: 'destructive',
        description: response.error,
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full lg:grid h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="/img/banners/login.png" 
          alt="Banner principal"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>

      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Digite seu e-mail e senha abaixo
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Informe o e-mail"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Informe a senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Autenticando...' : 'Fazer login'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
