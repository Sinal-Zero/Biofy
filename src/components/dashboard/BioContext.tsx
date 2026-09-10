import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  createBlock as apiCreateBlock,
  deleteBlock as apiDeleteBlock,
  fetchMyBio,
  reorderBlocks as apiReorderBlocks,
  updateBlock as apiUpdateBlock,
  updatePage,
  updateProfile,
  type BioBundle,
} from "@/lib/bio-data";
import {
  mergeTheme,
  type BioBlock,
  type BioProfile,
  type BioTheme,
  type BlockConfig,
} from "@/lib/bio-types";
import { getTemplate } from "@/lib/templates";
import { getBlockDef } from "@/lib/blocks";

export type SaveState = "idle" | "saving" | "saved";
type ProfilePatch = Partial<Pick<BioProfile, "username" | "display_name" | "avatar_url" | "bio">>;

interface BioContextValue {
  bundle: BioBundle;
  theme: BioTheme;
  saveState: SaveState;
  patchProfile: (patch: ProfilePatch) => void;
  patchTheme: (patch: Partial<BioTheme>) => void;
  applyTemplate: (templateId: string) => void;
  addBlock: (type: string) => Promise<void>;
  patchBlock: (
    id: string,
    patch: {
      title?: string | null;
      url?: string | null;
      config?: BlockConfig;
      is_visible?: boolean;
    },
  ) => void;
  duplicateBlock: (id: string) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  moveBlock: (fromId: string, toIndex: number) => void;
  refresh: () => Promise<void>;
}

const BioContext = createContext<BioContextValue | null>(null);

export function useBio() {
  const ctx = useContext(BioContext);
  if (!ctx) throw new Error("useBio must be used inside BioProvider");
  return ctx;
}

export function BioProvider({
  initial,
  children,
  userId,
}: {
  initial: BioBundle;
  userId: string;
  children: ReactNode;
}) {
  const [bundle, setBundle] = useState<BioBundle>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bundleRef = useRef(bundle);

  useEffect(() => {
    bundleRef.current = bundle;
  }, [bundle]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      Object.values(activeTimers).forEach(clearTimeout);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const finishSave = useCallback(() => {
    setSaveState("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveState("idle"), 2200);
  }, []);

  const schedule = useCallback(
    (key: string, run: () => Promise<void>, delay = 700) => {
      setSaveState("saving");
      const existing = timers.current[key];
      if (existing) clearTimeout(existing);
      timers.current[key] = setTimeout(() => {
        run()
          .then(finishSave)
          .catch(() => {
            setSaveState("idle");
            toast.error("Não conseguimos salvar essa alteração.");
          });
      }, delay);
    },
    [finishSave],
  );

  const theme = useMemo(() => mergeTheme(bundle.page.theme), [bundle.page.theme]);

  const patchProfile = useCallback(
    (patch: ProfilePatch) => {
      setBundle((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
      schedule("profile", async () => {
        await updateProfile(userId, patch);
      });
    },
    [schedule, userId],
  );

  const patchTheme = useCallback(
    (patch: Partial<BioTheme>) => {
      setBundle((prev) => {
        const nextTheme = { ...mergeTheme(prev.page.theme), ...patch };
        return { ...prev, page: { ...prev.page, theme: nextTheme } };
      });
      schedule("theme", async () => {
        await updatePage(bundleRef.current.page.id, {
          theme: { ...mergeTheme(bundleRef.current.page.theme) },
        });
      });
    },
    [schedule],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = getTemplate(templateId);
      setBundle((prev) => ({
        ...prev,
        page: { ...prev.page, template: tpl.id, theme: { ...tpl.theme } },
      }));
      schedule(
        "template",
        async () => {
          await updatePage(bundleRef.current.page.id, {
            template: tpl.id,
            theme: { ...tpl.theme },
          });
        },
        250,
      );
    },
    [schedule],
  );

  const addBlock = useCallback(
    async (type: string) => {
      const def = getBlockDef(type);
      setSaveState("saving");
      try {
        const created = await apiCreateBlock({
          page_id: bundleRef.current.page.id,
          type,
          title: def.social ? def.label : type === "text" ? "" : "Novo link",
          url: null,
          config: type === "text" ? { text: "Escreva algo sobre você" } : {},
          position: bundleRef.current.blocks.length,
        });
        setBundle((prev) => ({ ...prev, blocks: [...prev.blocks, created] }));
        finishSave();
      } catch {
        setSaveState("idle");
        toast.error("Não foi possível adicionar o bloco.");
      }
    },
    [finishSave],
  );

  const patchBlock = useCallback<BioContextValue["patchBlock"]>(
    (id, patch) => {
      setBundle((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === id
            ? {
                ...block,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.url !== undefined ? { url: patch.url } : {}),
                ...(patch.is_visible !== undefined ? { is_visible: patch.is_visible } : {}),
                ...(patch.config !== undefined
                  ? { config: { ...block.config, ...patch.config } }
                  : {}),
              }
            : block,
        ),
      }));
      schedule(`block:${id}`, async () => {
        const current = bundleRef.current.blocks.find((block) => block.id === id);
        if (!current) return;
        await apiUpdateBlock(id, {
          title: current.title,
          url: current.url,
          config: current.config,
          is_visible: current.is_visible,
        });
      });
    },
    [schedule],
  );

  const duplicateBlock = useCallback(
    async (id: string) => {
      const source = bundleRef.current.blocks.find((block) => block.id === id);
      if (!source) return;
      setSaveState("saving");
      try {
        const created = await apiCreateBlock({
          page_id: source.page_id,
          type: source.type,
          title: source.title,
          url: source.url,
          config: source.config,
          position: bundleRef.current.blocks.length,
        });
        setBundle((prev) => ({ ...prev, blocks: [...prev.blocks, created] }));
        finishSave();
      } catch {
        setSaveState("idle");
        toast.error("Não foi possível duplicar o bloco.");
      }
    },
    [finishSave],
  );

  const removeBlock = useCallback(
    async (id: string) => {
      const snapshot = bundleRef.current.blocks;
      setBundle((prev) => ({ ...prev, blocks: prev.blocks.filter((block) => block.id !== id) }));
      setSaveState("saving");
      try {
        await apiDeleteBlock(id);
        finishSave();
      } catch {
        setBundle((prev) => ({ ...prev, blocks: snapshot }));
        setSaveState("idle");
        toast.error("Não foi possível excluir o bloco.");
      }
    },
    [finishSave],
  );

  const moveBlock = useCallback(
    (fromId: string, toIndex: number) => {
      setBundle((prev) => {
        const list = [...prev.blocks];
        const fromIndex = list.findIndex((block) => block.id === fromId);
        if (fromIndex < 0) return prev;
        const [moved] = list.splice(fromIndex, 1);
        if (!moved) return prev;
        const clamped = Math.max(0, Math.min(toIndex, list.length));
        list.splice(clamped, 0, moved);
        const reindexed: BioBlock[] = list.map((block, index) => ({ ...block, position: index }));
        return { ...prev, blocks: reindexed };
      });
      schedule(
        "reorder",
        async () => {
          await apiReorderBlocks(bundleRef.current.blocks);
        },
        400,
      );
    },
    [schedule],
  );

  const refresh = useCallback(async () => {
    const next = await fetchMyBio(userId);
    setBundle(next);
  }, [userId]);

  const value = useMemo<BioContextValue>(
    () => ({
      bundle,
      theme,
      saveState,
      patchProfile,
      patchTheme,
      applyTemplate,
      addBlock,
      patchBlock,
      duplicateBlock,
      removeBlock,
      moveBlock,
      refresh,
    }),
    [
      bundle,
      theme,
      saveState,
      patchProfile,
      patchTheme,
      applyTemplate,
      addBlock,
      patchBlock,
      duplicateBlock,
      removeBlock,
      moveBlock,
      refresh,
    ],
  );

  return <BioContext.Provider value={value}>{children}</BioContext.Provider>;
}
