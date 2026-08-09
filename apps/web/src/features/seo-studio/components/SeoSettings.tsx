"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppPageHeader,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppSwitch,
  AppTextarea,
  Label,
  PermissionGuard,
} from "@/components/ui";
import { useSeoSettings, useUpdateSeoSettings } from "../hooks";
import { SEO_ROBOTS_POLICY_OPTIONS } from "../constants";
import type { SeoRobotsPolicy } from "../types";
import { SeoImageField } from "./SeoImageField";

interface SettingsFormState {
  defaultTitleTemplate: string;
  defaultDescription: string;
  defaultRobotsPolicy: SeoRobotsPolicy;
  sitemapIncludeDefault: boolean;
  organizationName: string;
  organizationDescription: string;
  socialProfiles: string[];
  homepageTitle: string;
  homepageDescription: string;
  defaultOgImageAssetId: number | null;
  defaultTwitterImageAssetId: number | null;
}

const EMPTY_FORM: SettingsFormState = {
  defaultTitleTemplate: "",
  defaultDescription: "",
  defaultRobotsPolicy: "index",
  sitemapIncludeDefault: true,
  organizationName: "",
  organizationDescription: "",
  socialProfiles: [],
  homepageTitle: "",
  homepageDescription: "",
  defaultOgImageAssetId: null,
  defaultTwitterImageAssetId: null,
};

function SeoSettings() {
  const t = useTranslations("seo");
  const { data, isLoading, isError, refetch } = useSeoSettings();
  const updateMutation = useUpdateSeoSettings();

  const [form, setForm] = useState<SettingsFormState>(EMPTY_FORM);
  const [socialInput, setSocialInput] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loadedData, setLoadedData] = useState<typeof data>(null);

  if (data && data !== loadedData) {
    setLoadedData(data);
    setForm({
      defaultTitleTemplate: data.defaultTitleTemplate ?? "",
      defaultDescription: data.defaultDescription ?? "",
      defaultRobotsPolicy: data.defaultRobotsPolicy,
      sitemapIncludeDefault: data.sitemapIncludeDefault,
      organizationName: data.organizationName ?? "",
      organizationDescription: data.organizationDescription ?? "",
      socialProfiles: data.socialProfiles ?? [],
      homepageTitle: data.homepageTitle ?? "",
      homepageDescription: data.homepageDescription ?? "",
      defaultOgImageAssetId: data.defaultOgImage ? Number(data.defaultOgImage.id) : null,
      defaultTwitterImageAssetId: data.defaultTwitterImage ? Number(data.defaultTwitterImage.id) : null,
    });
    setDirty(false);
  }

  const patch = useCallback((patch: Partial<SettingsFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const addSocialProfile = () => {
    const url = socialInput.trim();
    if (!url) return;
    if (form.socialProfiles.includes(url)) return;
    patch({ socialProfiles: [...form.socialProfiles, url] });
    setSocialInput("");
  };

  const removeSocialProfile = (url: string) => {
    patch({ socialProfiles: form.socialProfiles.filter((p) => p !== url) });
  };

  const handleImageSelect = (
    field: "defaultOgImageAssetId" | "defaultTwitterImageAssetId",
    assetId: number | null,
  ) => {
    patch({ [field]: assetId });
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        default_title_template: form.defaultTitleTemplate.trim() || null,
        default_description: form.defaultDescription.trim() || null,
        default_robots_policy: form.defaultRobotsPolicy,
        sitemap_include_default: form.sitemapIncludeDefault,
        organization_name: form.organizationName.trim() || null,
        organization_description: form.organizationDescription.trim() || null,
        social_profiles: form.socialProfiles,
        homepage_title: form.homepageTitle.trim() || null,
        homepage_description: form.homepageDescription.trim() || null,
        default_og_image_asset_id: form.defaultOgImageAssetId,
        default_twitter_image_asset_id: form.defaultTwitterImageAssetId,
      },
      {
        onSuccess: () => {
          toast.success(t("settingsSaved"));
          setDirty(false);
        },
      },
    );
  };

  if (isLoading) {
    return <AppLoadingState />;
  }

  if (isError || !data) {
    return <AppErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <AppPageHeader
        title={t("settingsTitle")}
        description={t("settingsDescription")}
        actions={
          <PermissionGuard permission="seo.manage_settings">
            <AppButton onClick={handleSave} disabled={!dirty || updateMutation.isPending}>
              {t("saveSettings")}
            </AppButton>
          </PermissionGuard>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("defaultTitleTemplate")}</AppCardTitle>
              <AppCardDescription>{t("defaultTitleTemplateHint")}</AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("defaultTitleTemplate")}</Label>
                <AppInput
                  value={form.defaultTitleTemplate}
                  onChange={(e) => patch({ defaultTitleTemplate: e.target.value })}
                  placeholder="%title% | %site_name%"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("defaultDescription")}</Label>
                <AppTextarea
                  value={form.defaultDescription}
                  onChange={(e) => patch({ defaultDescription: e.target.value })}
                  rows={3}
                />
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("homepageTitle")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("homepageTitle")}</Label>
                <AppInput
                  value={form.homepageTitle}
                  onChange={(e) => patch({ homepageTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("homepageDescription")}</Label>
                <AppTextarea
                  value={form.homepageDescription}
                  onChange={(e) => patch({ homepageDescription: e.target.value })}
                  rows={2}
                />
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("organizationName")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("organizationName")}</Label>
                <AppInput
                  value={form.organizationName}
                  onChange={(e) => patch({ organizationName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("organizationDescription")}</Label>
                <AppTextarea
                  value={form.organizationDescription}
                  onChange={(e) => patch({ organizationDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("socialProfiles")}</Label>
                <p className="text-xs text-muted-foreground">{t("socialProfilesHint")}</p>
                <div className="flex gap-2">
                  <AppInput
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSocialProfile();
                      }
                    }}
                    placeholder={t("socialProfilePlaceholder")}
                    dir="ltr"
                    className="text-left"
                  />
                  <AppButton
                    type="button"
                    variant="outline"
                    onClick={addSocialProfile}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    {t("addSocialProfile")}
                  </AppButton>
                </div>
                {form.socialProfiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {form.socialProfiles.map((url) => (
                      <div
                        key={url}
                        className="flex items-center justify-between gap-2 rounded-lg border p-2"
                      >
                        <span className="truncate text-sm text-muted-foreground" dir="ltr">
                          {url}
                        </span>
                        <AppButton
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeSocialProfile(url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </AppButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AppCardContent>
          </AppCard>
        </div>

        <div className="space-y-4">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("defaultRobotsPolicy")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("defaultRobotsPolicy")}</Label>
                <AppSelect
                  value={form.defaultRobotsPolicy}
                  onValueChange={(val) => patch({ defaultRobotsPolicy: val as SeoRobotsPolicy })}
                >
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {SEO_ROBOTS_POLICY_OPTIONS.map((opt) => (
                      <AppSelectItem key={opt.value} value={opt.value}>
                        {t(opt.label)}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>{t("sitemapIncludeDefault")}</Label>
                </div>
                <AppSwitch
                  checked={form.sitemapIncludeDefault}
                  onCheckedChange={(checked) => patch({ sitemapIncludeDefault: checked })}
                />
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("defaultOgImage")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              <SeoImageField
                label={t("defaultOgImage")}
                image={data.defaultOgImage}
                onSelect={(assetId) => handleImageSelect("defaultOgImageAssetId", assetId)}
              />
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("defaultTwitterImage")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <SeoImageField
                label={t("defaultTwitterImage")}
                image={data.defaultTwitterImage}
                onSelect={(assetId) => handleImageSelect("defaultTwitterImageAssetId", assetId)}
              />
            </AppCardContent>
          </AppCard>
        </div>
      </div>
    </div>
  );
}

export { SeoSettings };
