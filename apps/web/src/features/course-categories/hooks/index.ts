"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "../services";
import { CATEGORIES_QUERY_KEY } from "../constants";
import type { CategoryFilterParams, CreateCategoryPayload, UpdateCategoryPayload } from "../types";

export function useCategories(params?: CategoryFilterParams) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, "list", params],
    queryFn: () => categoriesService.list(params),
  });
}

export function useCategoriesTree() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, "tree"],
    queryFn: () => categoriesService.getTree(),
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, "detail", id],
    queryFn: () => categoriesService.getById(id!),
    enabled: !!id,
  });
}

export function useCategoriesMetrics() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, "metrics"],
    queryFn: () => categoriesService.getMetrics(),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => categoriesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryPayload }) => categoriesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useRestoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useForceDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.forceDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useDuplicateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useToggleFeatureCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.toggleFeatured(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useToggleActiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useExportCategories() {
  return useMutation({
    mutationFn: () => categoriesService.exportCsv(),
  });
}