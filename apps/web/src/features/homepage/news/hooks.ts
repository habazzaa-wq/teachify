"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { newsService } from "./services";
import type { NewsInput, TickerConfig } from "./types";

export const newsKeys = {
  public: ["news", "public"] as const,
  list: ["news", "list"] as const,
  detail: (id: number) => ["news", "detail", id] as const,
  ticker: ["news", "ticker"] as const,
};

export function usePublicNews() {
  return useQuery({
    queryKey: newsKeys.public,
    queryFn: newsService.getPublicNews,
    staleTime: 30_000,
  });
}

export function useNewsList(params?: { inactive?: boolean }) {
  return useQuery({
    queryKey: [...newsKeys.list, params ?? {}],
    queryFn: () => newsService.list(params),
  });
}

export function useNews(id: number) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewsInput) => newsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.list });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      toast.success("تمت إضافة الخبر بنجاح");
    },
    onError: () => toast.error("تعذّر إضافة الخبر"),
  });
}

export function useUpdateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<NewsInput> }) =>
      newsService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: newsKeys.list });
      qc.invalidateQueries({ queryKey: newsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      toast.success("تم تحديث الخبر بنجاح");
    },
    onError: () => toast.error("تعذّر تحديث الخبر"),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => newsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.list });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      toast.success("تم حذف الخبر");
    },
    onError: () => toast.error("تعذّر حذف الخبر"),
  });
}

export function useReorderNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      newsService.reorder(orders),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.list });
      qc.invalidateQueries({ queryKey: newsKeys.public });
    },
    onError: () => toast.error("تعذّر إعادة ترتيب الأخبار"),
  });
}

export function useTickerSettings() {
  return useQuery({
    queryKey: newsKeys.ticker,
    queryFn: newsService.getTickerSettings,
  });
}

export function useUpdateTickerSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticker: TickerConfig) => newsService.updateTickerSettings(ticker),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.ticker });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      toast.success("تم حفظ إعدادات شريط الأخبار");
    },
    onError: () => toast.error("تعذّر حفظ إعدادات شريط الأخبار"),
  });
}
