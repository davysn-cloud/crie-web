import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

interface UploadParams {
  postCardId: string;
  file: File;
  format?: string;
}

export function useAssetUpload() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postCardId, file }: UploadParams) => {
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `post-assets/${postCardId}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("post-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("post-assets")
        .getPublicUrl(path);

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Create asset version
      const { data: latestVersion } = await supabase
        .from("asset_versions")
        .select("version")
        .eq("post_card_id", postCardId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (latestVersion?.version ?? 0) + 1;

      const { error: insertError } = await supabase
        .from("asset_versions")
        .insert({
          post_card_id: postCardId,
          version: nextVersion,
          file_url: publicUrl,
          file_type: file.type,
          thumbnail_url: publicUrl,
          width: dimensions.width,
          height: dimensions.height,
          is_approved: false,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      return { publicUrl, version: nextVersion };
    },
    onSuccess: () => {
      toast.success("Imagem enviada");
      queryClient.invalidateQueries({ queryKey: ["post-cards"] });
    },
    onError: (err) => {
      toast.error(`Erro no upload: ${err instanceof Error ? err.message : "Erro"}`);
    },
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}
