import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../../components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Checkbox } from '../../../../components/ui/checkbox';
import Link from 'next/link';
import { CircleArrowLeft } from 'lucide-react';
import {
  ICompaniesReturnToSelectProps,
  ICompanyToSelect,
} from '../../companies/types';
import { getAllActiveCompaniesToSelect } from '../../../../actions/companies/getAllActiveCompaniesToSelect';
import { useToast } from '../../../../hooks/use-toast';
import {
  ContributorFormData,
  contributorFormSchema,
} from '../../../../schemas/contributorSchema';
import FileUploadField from '../../../../components/ui/fileUploadField';
import { uploadToS3 } from '@/utils/s3Upload';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const localContributorFormSchema = contributorFormSchema.extend({
  photoFile: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (file) {
          // Verificar se é um objeto e tem a propriedade 'type'
          return (
            typeof file === 'object' &&
            'type' in file &&
            ['image/jpeg', 'image/png', 'image/gif'].includes(
              file.type as string,
            )
          );
        }
        return true;
      },
      {
        message: 'O arquivo deve ser uma imagem (JPEG, PNG ou GIF).',
      },
    ),
});

type LocalContributorFormData = z.infer<typeof localContributorFormSchema>;

interface ContributorFormProps {
  initialData?: Partial<ContributorFormData>;
  onSubmit: (values: ContributorFormData) => Promise<void>;
  submitButtonText: string;
}

export const ContributorForm = forwardRef<
  { reset: () => void },
  ContributorFormProps
>(({ initialData, onSubmit, submitButtonText }, ref) => {
  const [companies, setCompanies] = useState<ICompanyToSelect[]>([]);
  const [selectKey, setSelectKey] = useState(0);
  const [observationLength, setObservationLength] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileUploadRef = useRef<{ reset: () => void } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const form = useForm<LocalContributorFormData>({
    resolver: zodResolver(localContributorFormSchema),
    defaultValues: {
      fullName: '',
      registration: '',
      telephone: '',
      cellPhone: '',
      observation: '',
      internalPassword: '',
      photoURL: '',
      companyIds: [],
      photoFile: undefined,
      ...initialData,
    },
  });

  useImperativeHandle(ref, () => ({
    reset: () => {
      form.reset();
      fileUploadRef.current?.reset();
      setSelectKey((prev) => prev + 1);
    },
  }));

  const { toast } = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      const result: ICompaniesReturnToSelectProps =
        await getAllActiveCompaniesToSelect();
      if (result.success) {
        setCompanies(result.data);
      } else {
        console.log(result);
        toast({
          variant: 'destructive',
          title: 'Ah não. Algo deu errado.',
          description: 'Não foi possível listar as empresas.',
        });
      }
    };

    fetchCompanies();
  }, [toast]);

  const handleSubmit = async (values: LocalContributorFormData) => {
    setUploading(true);
    try {
      if (values.photoFile instanceof File) {
        const uploadedUrl = await uploadToS3(values.photoFile);
        values.photoURL = uploadedUrl;
      }

      const { photoFile, ...submissionData } = values;
      await onSubmit(submissionData);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o colaborador.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="w-full flex justify-end">
        <Link href={'/contributors'}>
          <Button>
            <CircleArrowLeft className="w-4 h-4 me-2" /> Voltar
          </Button>
        </Link>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="flex items-start justify-start">
            <FileUploadField
              form={form}
              name="photoFile"
              photoUrl={form.getValues().photoURL}
              maxSizeMB={0.5}
              maxWidthOrHeight={800}
              ref={fileUploadRef}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe o nome completo"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe a matrícula"
                      maxLength={20}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cellPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe o celular"
                      mask="(##) #####-####"
                      maxLength={16}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe o telefone"
                      mask="(##) ####-####"
                      maxLength={15}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha interna</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe a senha interna"
                      maxLength={20}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-full">
              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informe a observação"
                        className="resize-none"
                        maxLength={200}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setObservationLength(e.target.value.length);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {200 - observationLength} caracteres restantes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-secondary/90 rounded-lg p-4 col-span-full">
            <FormField
              control={form.control}
              name="companyIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Empresas</FormLabel>
                    <FormDescription>
                      Selecione as empresas a qual o colaborador pertence
                    </FormDescription>
                  </div>
                  <Command className='rounded-lg border shadow-md'>
                    <CommandInput
                      placeholder="Procurar empresa..."
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px] w-full">
                          {filteredCompanies.map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.name}
                              className="px-4"
                            >
                              <FormField
                                key={company.id}
                                control={form.control}
                                name="companyIds"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          company.id,
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                company.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) =>
                                                    value !== company.id,
                                                ),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {company.name}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end w-100 mt-6">
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Enviando...' : submitButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
});

ContributorForm.displayName = 'ContributorForm';

export default ContributorForm;
