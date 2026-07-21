"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { domainsService } from "../services";
import { platformDomainsService } from "../services/platformDomainsService";
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
    refetchInterval: (query) => {
      const domain = query.state.data;
      if (domain && domain.status !== "active" && domain.status !== "failed") {
        return 3000;
      }
      return false;
    },
  });
}

export function useDomainsMetrics() {
  return useQuery({
    queryKey: [DOMAINS_QUERY_KEY, "metrics"],
    queryFn: () => domainsService.getMetrics(),
  });
}

export function useDomainStatus(id: string | null, enabled = false) {
  return useQuery({
    queryKey: [DOMAINS_QUERY_KEY, "status", id],
    queryFn: () => domainsService.getStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.verification.active) {
        return 3000;
      }
      return false;
    },
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

export interface DomainDashboardMetrics {
  total: number;
  active: number;
  pendingDns: number;
  sslIssuing: number;
  sslErrors: number;
  suspended: number;
}

export function useDomainMetrics() {
  const domainsQuery = useDomains();
  const domains = domainsQuery.data?.data ?? [];

  const metrics = useMemo<DomainDashboardMetrics>(() => {
    if (domains.length === 0) {
      return { total: 0, active: 0, pendingDns: 0, sslIssuing: 0, sslErrors: 0, suspended: 0 };
    }
    return {
      total: domains.length,
      active: domains.filter((d) => d.status === "active").length,
      pendingDns: domains.filter((d) => d.dnsStatus === "pending").length,
      sslIssuing: domains.filter((d) => d.ssl.status === "pending").length,
      sslErrors: domains.filter((d) => d.ssl.status === "error" || d.ssl.status === "expired").length,
      suspended: domains.filter((d) => d.status === "removed" || !d.active).length,
    };
  }, [domains]);

  return {
    metrics,
    isLoading: domainsQuery.isLoading,
  };
}

const PLATFORM_DOMAINS_QUERY_KEY = "platform-domains";

export function usePlatformDomains(params?: DomainsFilterParams) {
  return useQuery({
    queryKey: [PLATFORM_DOMAINS_QUERY_KEY, "list", params],
    queryFn: () => platformDomainsService.list(params),
    select: (data) => data,
  });
}

export function usePlatformDomain(id: string | null) {
  return useQuery({
    queryKey: [PLATFORM_DOMAINS_QUERY_KEY, "detail", id],
    queryFn: () => platformDomainsService.getById(id!),
    enabled: !!id,
  });
}

export function usePlatformCreateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDomainPayload) => platformDomainsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformDomainsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformBulkDeleteDomains() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => platformDomainsService.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformBulkEnableHttps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => platformDomainsService.bulkEnableHttps(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformBulkDisableDomains() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => platformDomainsService.bulkDisable(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformBulkMakePrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => platformDomainsService.bulkMakePrimary(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformRenewSsl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformDomainsService.renewSsl(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformRefreshStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformDomainsService.refreshStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PLATFORM_DOMAINS_QUERY_KEY] });
    },
  });
}

export function usePlatformDomainMetrics() {
  const domainsQuery = usePlatformDomains();
  const domains = domainsQuery.data?.data ?? [];

  const metrics = useMemo<DomainDashboardMetrics>(() => {
    if (domains.length === 0) {
      return { total: 0, active: 0, pendingDns: 0, sslIssuing: 0, sslErrors: 0, suspended: 0 };
    }
    return {
      total: domains.length,
      active: domains.filter((d) => d.status === "active").length,
      pendingDns: domains.filter((d) => d.dnsStatus === "pending").length,
      sslIssuing: domains.filter((d) => d.ssl.status === "pending").length,
      sslErrors: domains.filter((d) => d.ssl.status === "error" || d.ssl.status === "expired").length,
      suspended: domains.filter((d) => d.status === "removed" || !d.active).length,
    };
  }, [domains]);

  return {
    metrics,
    isLoading: domainsQuery.isLoading,
  };
}
