"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  seoContentService,
  seoKeywordService,
  seoLinkSearchService,
  seoOverviewService,
  seoSettingService,
} from "../services";
import { SEO_QUERY_KEY } from "../constants/queryKeys";
import type {
  SeoContentFilterParams,
  SeoContentPayload,
  SeoKeywordFilterParams,
  SeoKeywordPayloadCreate,
  SeoKeywordPayloadUpdate,
  SeoSettingPayload,
} from "../types";

export function useSeoContents(params?: SeoContentFilterParams) {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "contents", "list", params],
    queryFn: () => seoContentService.list(params),
  });
}

export function useSeoContent(id: string | null) {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "contents", "detail", id],
    queryFn: () => seoContentService.get(id!),
    enabled: !!id,
  });
}

export function useSeoContentRevisions(id: string | null) {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "contents", "revisions", id],
    queryFn: () => seoContentService.revisions(id!),
    enabled: !!id,
  });
}

export function useSeoOverview() {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "overview"],
    queryFn: () => seoOverviewService.get(),
  });
}

export function useSeoKeywords(params?: SeoKeywordFilterParams) {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "keywords", "list", params],
    queryFn: () => seoKeywordService.list(params),
  });
}

export function useSeoKeyword(id: string | null) {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "keywords", "detail", id],
    queryFn: () => seoKeywordService.get(id!),
    enabled: !!id,
  });
}

export function useSeoSettings() {
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "settings"],
    queryFn: () => seoSettingService.get(),
  });
}

export function useSeoLinkSearch(search: string, enabled = true) {
  const trimmed = search.trim();
  return useQuery({
    queryKey: [SEO_QUERY_KEY, "link-search", trimmed],
    queryFn: () => seoLinkSearchService.search(trimmed, 20),
    enabled: enabled && trimmed.length > 0,
    staleTime: 30_000,
  });
}

// ── Content mutations ───────────────────────────────────────────────────────

function useInvalidateSeo() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [SEO_QUERY_KEY] });
  };
}

export function useCreateSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (payload: SeoContentPayload) => seoContentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SeoContentPayload }) =>
      seoContentService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoContentService.delete(id),
    onSuccess: invalidate,
  });
}

export function usePublishSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoContentService.publish(id),
    onSuccess: invalidate,
  });
}

export function useUnpublishSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoContentService.unpublish(id),
    onSuccess: invalidate,
  });
}

export function useArchiveSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoContentService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreSeoContent() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoContentService.restore(id),
    onSuccess: invalidate,
  });
}

// ── Keyword mutations ───────────────────────────────────────────────────────

export function useCreateSeoKeyword() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (payload: SeoKeywordPayloadCreate) => seoKeywordService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSeoKeyword() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SeoKeywordPayloadUpdate }) =>
      seoKeywordService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSeoKeyword() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (id: string) => seoKeywordService.delete(id),
    onSuccess: invalidate,
  });
}

// ── Settings mutations ──────────────────────────────────────────────────────

export function useUpdateSeoSettings() {
  const invalidate = useInvalidateSeo();
  return useMutation({
    mutationFn: (payload: SeoSettingPayload) => seoSettingService.update(payload),
    onSuccess: invalidate,
  });
}
