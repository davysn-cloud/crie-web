import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { POST_STAGES } from "@/lib/constants";
import { useMoveCard } from "@/features/kanban/hooks/useMoveCard";
import { CommentThread } from "@/features/comments/CommentThread";
import { ImagePinOverlay } from "@/features/comments/ImagePinOverlay";
import { ActivityTimeline } from "./ActivityTimeline";
import type { PostCard, CopyVersion, AssetVersion } from "@/types";
import { PostCardStageBar } from "./PostCardStageBar";
import { CopyVersionsList } from "./CopyVersionsList";
import { CopyEditor } from "./CopyEditor";
import { AssetVersionsList } from "./AssetVersionsList";
import { AssetUploader } from "./AssetUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function PostCardDetailPage() {
  const { cardId, agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId, user } = useAuthStore();
  const moveCard = useMoveCard();

  const { data: card } = useQuery({
    queryKey: ["post-card", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_cards")
        .select(
          `*,
          copy_versions(*),
          asset_versions(*)`,
        )
        .eq("id", cardId!)
        .single();

      if (error) throw error;
      return data as PostCard & { copy_versions: CopyVersion[]; asset_versions: AssetVersion[] };
    },
    enabled: !!cardId,
  });

  if (!card) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const copyVersions = card.copy_versions ?? [];
  const assetVersions = card.asset_versions ?? [];
  const latestAsset = assetVersions.length > 0
    ? [...assetVersions].sort((a, b) => b.version - a.version)[0]
    : null;

  function handleStageChange(newStage: string) {
    if (!currentWorkspaceId || !card || !user) return;
    moveCard.mutate({
      cardId: card.id,
      fromStage: card.stage,
      newStage: newStage as never,
      workspaceId: currentWorkspaceId,
      userId: user.id,
    });
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(`/app/${agencySlug}/w/${workspaceSlug}`)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao Kanban
      </Button>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{card.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          {card.post_type && <Badge variant="secondary">{card.post_type}</Badge>}
          <Select value={card.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POST_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stage progress */}
      <PostCardStageBar currentStage={card.stage} />

      {/* Tabs */}
      <Tabs defaultValue="copy" className="mt-6">
        <TabsList>
          <TabsTrigger value="copy">
            Copy ({copyVersions.length})
          </TabsTrigger>
          <TabsTrigger value="design">
            Design ({assetVersions.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comentários
          </TabsTrigger>
          <TabsTrigger value="activity">
            Atividade
          </TabsTrigger>
        </TabsList>

        {/* COPY TAB */}
        <TabsContent value="copy" className="mt-4 space-y-6">
          <CopyEditor
            postCardId={card.id}
            currentVersion={copyVersions.length}
          />
          <CopyVersionsList versions={copyVersions} postCardId={card.id} />
        </TabsContent>

        {/* DESIGN TAB */}
        <TabsContent value="design" className="mt-4 space-y-6">
          <AssetUploader
            postCardId={card.id}
            currentVersion={assetVersions.length}
          />

          {/* Última arte com pins de comentário */}
          {latestAsset && latestAsset.file_type.startsWith("image/") && (
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Arte atual (v{latestAsset.version}) — clique na imagem para comentar
              </h3>
              <ImagePinOverlay
                imageUrl={latestAsset.file_url}
                assetVersionId={latestAsset.id}
              />
            </div>
          )}

          <Separator />
          <AssetVersionsList versions={assetVersions} postCardId={card.id} />
        </TabsContent>

        {/* COMMENTS TAB */}
        <TabsContent value="comments" className="mt-4">
          <h3 className="mb-3 text-sm font-medium">Comentários gerais do card</h3>
          <CommentThread targetType="card" targetId={card.id} />
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="mt-4">
          <h3 className="mb-3 text-sm font-medium">Histórico de transições</h3>
          <ActivityTimeline postCardId={card.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
