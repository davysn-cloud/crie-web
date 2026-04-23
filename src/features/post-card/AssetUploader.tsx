import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AssetUploaderProps {
  postCardId: string;
  currentVersion: number;
}

export function AssetUploader({ postCardId, currentVersion }: AssetUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { user, currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);

      const ext = file.name.split(".").pop();
      const path = `${currentWorkspaceId}/${postCardId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-assets")
        .upload(path, file);

      if (uploadError) {
        toast.error(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("post-assets").getPublicUrl(path);

      const { error } = await supabase.from("asset_versions").insert({
        post_card_id: postCardId,
        version: currentVersion + 1,
        file_url: urlData.publicUrl,
        file_type: file.type,
        created_by: user.id,
      });

      setUploading(false);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Arte enviada");
        queryClient.invalidateQueries({ queryKey: ["post-card", postCardId] });
        queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
      }

      e.target.value = "";
    },
    [postCardId, currentVersion, user, currentWorkspaceId, queryClient],
  );

  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50">
      <Upload className="h-8 w-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {uploading ? "Enviando..." : "Clique ou arraste uma imagem"}
      </span>
      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </label>
  );
}
