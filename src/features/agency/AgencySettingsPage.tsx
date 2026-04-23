import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export function AgencySettingsPage() {
  const { currentAgencyId, agencies, fetchAgencies } = useAuthStore();
  const agency = agencies.find((a) => a.agency_id === currentAgencyId)?.agency;
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (agency) {
      form.reset({ name: agency.name });
    }
  }, [agency, form]);

  async function onSubmit(data: FormData) {
    if (!currentAgencyId) return;
    setLoading(true);
    const { error } = await supabase
      .from("agencies")
      .update({ name: data.name })
      .eq("id", currentAgencyId);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Agência atualizada");
      await fetchAgencies();
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Configurações da Agência</h2>
      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da agência</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
