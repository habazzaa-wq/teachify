"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { domainsService } from "../services";
import { DOMAINS_QUERY_KEY } from "../constants";
import type { DomainsFilterParams, CreateDomainPayload, PlatformDomain } from "../types";

export function useDomains(params?: DomainsFilterParams) {
  return useQuery({
    queryKey: [DOMAINS_QUERY_KEY, "list", params],
    queryFn: () => domainsService.list(params),
    select: (data) => data,
  });
}

export function useDomain(id: string | null) {
  return useQuery({
    queryKey: [DOMAINS_QUERY_KEY, "detail", id],
    queryFn: () => domainsService.getById(id!),
    enabled: !!id,
  });
}

export function useDomainsMetrics() {
  return useQuery({
    queryKey: [DOMAINS_QUERY_KEY, "metrics"],
    queryFn: () => domainsService.getMetrics(),
  });
}

export function useCreateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDomainPayload) => domainsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlatformDomain> }) =>
      domainsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useVerifyDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainsService.verify(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useRenewSsl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainsService.renewSsl(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useRefreshStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainsService.refreshStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useMakePrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainsService.makePrimary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domainsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useBulkDeleteDomains() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => domainsService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useBulkVerifyDomains() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => domainsService.bulkVerify(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useBulkEnableHttps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => domainsService.bulkEnableHttps(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useBulkDisableDomains() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => domainsService.bulkDisable(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}

export function useBulkMakePrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => domainsService.bulkMakePrimary(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] });
    },
  });
}
