import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * App-level confirmation dialog.
 *
 * Replaces window.confirm(), which is silently suppressed inside embedded
 * previews and some browsers — a suppressed confirm returns false, so the
 * action it guarded appeared to do nothing at all.
 */

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void };

let listener: ((p: PendingConfirm | null) => void) | null = null;
let queued: PendingConfirm | null = null;

export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { title: options } : options;
  return new Promise<boolean>((resolve) => {
    const pending: PendingConfirm = { ...opts, resolve };
    if (listener) listener(pending);
    else queued = pending;
  });
}

/** Fire-and-forget variant for simple `if (confirm(...)) doThing()` call sites. */
export function confirmThen(options: ConfirmOptions | string, onConfirm: () => void) {
  void confirmDialog(options).then((ok) => {
    if (ok) onConfirm();
  });
}

export type PromptOptions = {
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PendingPrompt = PromptOptions & { resolve: (value: string | null) => void };

let promptListener: ((p: PendingPrompt | null) => void) | null = null;
let queuedPrompt: PendingPrompt | null = null;

/** Text-input dialog. Resolves with the trimmed value, or null when cancelled. */
export function promptDialog(options: PromptOptions | string): Promise<string | null> {
  const opts = typeof options === "string" ? { title: options } : options;
  return new Promise<string | null>((resolve) => {
    const pending: PendingPrompt = { ...opts, resolve };
    if (promptListener) promptListener(pending);
    else queuedPrompt = pending;
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [prompt, setPrompt] = useState<PendingPrompt | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    listener = setPending;
    if (queued) {
      setPending(queued);
      queued = null;
    }
    promptListener = (p) => {
      setPrompt(p);
      setValue(p?.defaultValue ?? "");
    };
    if (queuedPrompt) {
      promptListener(queuedPrompt);
      queuedPrompt = null;
    }
    return () => {
      listener = null;
      promptListener = null;
    };
  }, []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const closePrompt = (result: string | null) => {
    prompt?.resolve(result);
    setPrompt(null);
  };

  const submitPrompt = () => {
    const trimmed = value.trim();
    closePrompt(trimmed ? trimmed : null);
  };

  return (
    <>
      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) close(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title ?? "Are you sure?"}</AlertDialogTitle>
            {pending?.description ? (
              <AlertDialogDescription>{pending.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>
              {pending?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={pending?.destructive === false ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              onClick={() => close(true)}
            >
              {pending?.confirmLabel ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!prompt} onOpenChange={(open) => { if (!open) closePrompt(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{prompt?.title ?? "Enter a value"}</DialogTitle>
            {prompt?.description ? <DialogDescription>{prompt.description}</DialogDescription> : null}
          </DialogHeader>
          <div className="space-y-1.5">
            {prompt?.label ? <Label htmlFor="prompt-dialog-input">{prompt.label}</Label> : null}
            <Input
              id="prompt-dialog-input"
              autoFocus
              value={value}
              placeholder={prompt?.placeholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitPrompt();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closePrompt(null)}>
              {prompt?.cancelLabel ?? "Cancel"}
            </Button>
            <Button onClick={submitPrompt} disabled={!value.trim()}>
              {prompt?.confirmLabel ?? "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
