import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyEditorProps {
  postCardId: string;
  currentVersion: number;
}

export function CopyEditor({ postCardId, currentVersion }: CopyEditorProps) {
  const [body, setBody] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  async function handleSubmit() {
    if (!body.trim() || !user) return;
    setSaving(true);

    const { error } = await supabase.from("copy_versions").insert({
      post_card_id: postCardId,
      version: currentVersion + 1,
      body: body.trim(),
      caption: caption.trim() || null,
      created_by: user.id,
    });

    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      setBody("");
      setCaption("");
      toast.success("Copy salva");
      queryClient.invalidateQueries({ queryKey: ["post-card", postCardId] });
      queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Escreva a copy..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
      />
      <Textarea
        placeholder="Legenda (opcional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{body.length} caracteres</span>
        <Button size="sm" onClick={handleSubmit} disabled={saving || !body.trim()}>
          {saving ? "Salvando..." : "Salvar versão"}
        </Button>
      </div>
    </div>
  );
}
