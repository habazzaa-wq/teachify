import axios from "axios";
import { resolveApiUrl } from "@/config/env";
import api from "@/services/api/axios";
import type { BlogListResponse, BlogPost, BlogPostPayload } from "./types";

function uploadErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "تعذر رفع الصورة إلى خادم الموقع.";
  }

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;
  return data?.message ?? Object.values(data?.errors ?? {}).flat()[0] ?? "تعذر رفع الصورة إلى خادم الموقع.";
}

export const blogService = {
  async list(search = ""): Promise<BlogListResponse> {
    const { data } = await api.get<BlogListResponse>("/blog/manage", {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async save(post: BlogPostPayload, id?: number): Promise<BlogPost> {
    const response = id
      ? await api.put<{ data: BlogPost }>(`/blog/manage/${id}`, post)
      : await api.post<{ data: BlogPost }>("/blog/manage", post);
    return response.data.data;
  },

  async show(id: number): Promise<BlogPost> {
    const { data } = await api.get<{ data: BlogPost }>(`/blog/manage/${id}`);
    return data.data;
  },

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post<{ data: { url: string } }>("/blog/manage/upload-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000,
      });
      return new URL(data.data.url, resolveApiUrl()).toString();
    } catch (error) {
      throw new Error(uploadErrorMessage(error), { cause: error });
    }
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/blog/manage/${id}`);
  },
};
