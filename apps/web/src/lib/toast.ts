import type { toast as SonnerToast } from "sonner";

let sonnerToast: typeof SonnerToast | null = null;

async function resolveToast(): Promise<typeof SonnerToast> {
  if (!sonnerToast) {
    const mod = await import("sonner");
    sonnerToast = mod.toast;
  }
  return sonnerToast;
}

function createLazyToast(): typeof SonnerToast {
  const proxy = new Proxy(
    function () {} as unknown as typeof SonnerToast,
    {
      get(_target, prop: PropertyKey) {
        return (...args: unknown[]) => {
          void resolveToast().then((t) => {
            const value = (t as unknown as Record<PropertyKey, unknown>)[prop];
            if (typeof value === "function") {
              (value as (...a: unknown[]) => void).apply(t, args);
            }
          });
        };
      },
      apply(_target, _thisArg, args) {
        void resolveToast().then((t) =>
          t(...(args as Parameters<typeof SonnerToast>)),
        );
      },
    },
  );

  return proxy;
}

export const toast = createLazyToast();
