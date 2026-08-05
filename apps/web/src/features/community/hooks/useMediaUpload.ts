"use client";

import { useCallback, useRef, useState } from "react";
import api from "@/services/api/axios";
import { toast } from "@/lib/toast";

export interface UploadedAsset {
  id: string;
  cdn_url: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
}

interface UploadFileResponse {
  data: {
    asset: {
      id: string | number;
      cdnUrl?: string;
      cdn_url?: string;
      originalFilename?: string;
      original_filename?: string;
      mimeType?: string;
      mime_type?: string;
      size?: number;
      sizeBytes?: number;
      size_bytes?: number;
    };
    cdn_url: string;
  };
}

async function uploadFile(file: File): Promise<UploadedAsset> {
  const form = new FormData();
  form.append("file", file);
  form.append("visibility", "organization");

  const response = await api.post<UploadFileResponse>(
    "/media-library/upload/file",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    },
  );

  const { asset, cdn_url } = response.data.data;
  return {
    id: String(asset.id),
    cdn_url: cdn_url || asset.cdnUrl || asset.cdn_url || "",
    original_filename:
      asset.originalFilename || asset.original_filename || file.name,
    mime_type: asset.mimeType || asset.mime_type || file.type,
    size_bytes: asset.sizeBytes ?? asset.size_bytes ?? asset.size ?? file.size,
  };
}

export function useCommunityUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File): Promise<UploadedAsset | null> => {
    setUploading(true);
    try {
      return await uploadFile(file);
    } catch {
      toast.error("تعذّر رفع الملف. تحقق من اتصالك وحاول مجددًا.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /** Upload several files, returning the ones that succeeded. */
  const uploadMany = useCallback(
    async (files: File[]): Promise<UploadedAsset[]> => {
      if (files.length === 0) return [];
      setUploading(true);
      const results = await Promise.allSettled(files.map(uploadFile));
      setUploading(false);
      const ok = results
        .filter(
          (r): r is PromiseFulfilledResult<UploadedAsset> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
      if (ok.length < results.length) {
        toast.error("بعض الملفات لم تُرفَع بنجاح.");
      }
      return ok;
    },
    [],
  );

  return { uploading, upload, uploadMany };
}

/** MediaRecorder-backed voice note recording. */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(
        () => setElapsed((s) => s + 1),
        1000,
      );
      return true;
    } catch {
      toast.error("تعذّر الوصول إلى الميكروفون.");
      return false;
    }
  }, []);

  /** Stop and return { blob, durationSeconds } or null if cancelled. */
  const stop = useCallback((): Promise<{
    blob: Blob;
    durationSeconds: number;
  } | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        resolve({ blob, durationSeconds: elapsed });
      };
      recorder.stop();
    });
  }, [elapsed]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current = null;
    setRecording(false);
    setElapsed(0);
  }, []);

  return { recording, elapsed, start, stop, cancel };
}
