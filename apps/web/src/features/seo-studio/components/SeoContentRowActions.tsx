"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Archive,
  ExternalLink,
  Globe,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  AppButton,
  AppConfirmDialog,
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuLabel,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
  PermissionGuard,
} from "@/components/ui";
import { routes } from "@/constants/routes";
import {
  useArchiveSeoContent,
  useDeleteSeoContent,
  usePublishSeoContent,
  useRestoreSeoContent,
  useUnpublishSeoContent,
} from "../hooks";
import type { SeoContent } from "../types";

interface SeoContentRowActionsProps {
  content: SeoContent;
}

function SeoContentRowActions({ content }: SeoContentRowActionsProps) {
  const t = useTranslations("seo");
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const publish = usePublishSeoContent();
  const unpublish = useUnpublishSeoContent();
  const archive = useArchiveSeoContent();
  const restore = useRestoreSeoContent();
  const remove = useDeleteSeoContent();

  const handlePublish = () => {
    publish.mutate(content.id, {
      onSuccess: () => toast.success(t("publishSuccess")),
      onError: () => toast.error(t("error")),
    });
  };

  const handleUnpublish = () => {
    unpublish.mutate(content.id, {
      onSuccess: () => toast.success(t("unpublishSuccess")),
      onError: () => toast.error(t("error")),
    });
  };

  const handleArchive = () => {
    archive.mutate(content.id, {
      onSuccess: () => toast.success(t("archiveSuccess")),
      onError: () => toast.error(t("error")),
    });
  };

  const handleRestore = () => {
    restore.mutate(content.id, {
      onSuccess: () => toast.success(t("restoreSuccess")),
      onError: () => toast.error(t("error")),
    });
  };

  const handleDelete = () => {
    remove.mutate(content.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(t("deleteSuccess"));
      },
      onError: () => toast.error(t("error")),
    });
  };

  return (
    <>
      <AppDropdownMenu>
        <AppDropdownMenuTrigger asChild>
          <AppButton variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </AppButton>
        </AppDropdownMenuTrigger>
        <AppDropdownMenuContent align="end">
          <AppDropdownMenuLabel>{content.title}</AppDropdownMenuLabel>
          <AppDropdownMenuSeparator />
          <PermissionGuard permission="seo.update">
            <AppDropdownMenuItem
              onClick={() => router.push(routes.seoContentEdit.replace("[id]", content.id))}
            >
              <Pencil className="h-4 w-4" />
              {t("editContent")}
            </AppDropdownMenuItem>
          </PermissionGuard>
          {content.publicPath && (
            <AppDropdownMenuItem
              onClick={() => window.open(content.publicPath!, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              {t("preview")}
            </AppDropdownMenuItem>
          )}
          <PermissionGuard permission="seo.publish">
            {content.status === "published" ? (
              <AppDropdownMenuItem onClick={handleUnpublish}>
                <Globe className="h-4 w-4" />
                {t("unpublish")}
              </AppDropdownMenuItem>
            ) : content.status !== "archived" ? (
              <AppDropdownMenuItem onClick={handlePublish}>
                <Globe className="h-4 w-4" />
                {t("publish")}
              </AppDropdownMenuItem>
            ) : null}
            {content.status !== "published" && content.status !== "archived" && (
              <AppDropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4" />
                {t("archive")}
              </AppDropdownMenuItem>
            )}
            {content.status === "archived" && (
              <AppDropdownMenuItem onClick={handleRestore}>
                <Undo2 className="h-4 w-4" />
                {t("restore")}
              </AppDropdownMenuItem>
            )}
          </PermissionGuard>
          <PermissionGuard permission="seo.delete">
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t("deleteContent")}
            </AppDropdownMenuItem>
          </PermissionGuard>
        </AppDropdownMenuContent>
      </AppDropdownMenu>

      <AppConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteConfirm")}
        description={t("deleteWarning")}
        confirmLabel={t("deleteContent")}
        destructive
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

export { SeoContentRowActions };
