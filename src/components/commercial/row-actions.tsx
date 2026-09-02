import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, ExternalLink } from "lucide-react";
import { confirmThen } from "@/components/confirm-dialog";

/**
 * One actions menu shared by every Commercial list (accounts, stakeholders,
 * opportunities) so Open / Edit / Archive / Delete always look and behave the
 * same way.
 */
export function RowActions({
  label,
  archived = false,
  onOpen,
  onEdit,
  onArchiveToggle,
  onDelete,
  deleteDescription,
  size = "default",
}: {
  label: string;
  archived?: boolean;
  onOpen?: () => void;
  onEdit?: () => void;
  onArchiveToggle?: (next: boolean) => void;
  onDelete?: () => void;
  deleteDescription?: string;
  size?: "default" | "sm";
}) {
  const btn = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={btn} aria-label={`Actions for ${label}`}>
          <MoreHorizontal className={icon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onOpen && (
          <DropdownMenuItem onSelect={() => onOpen()}>
            <ExternalLink className="mr-2 h-4 w-4" /> Open
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit()}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {onArchiveToggle && (
          archived ? (
            <DropdownMenuItem onSelect={() => onArchiveToggle(false)}>
              <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onArchiveToggle(true)}>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </DropdownMenuItem>
          )
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                confirmThen(
                  {
                    title: `Delete "${label}"?`,
                    description: deleteDescription ?? "This cannot be undone.",
                    confirmLabel: "Delete",
                  },
                  onDelete,
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
