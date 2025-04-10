import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MovableBadgeProps extends React.ComponentProps<typeof Badge> {
  onRemove?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (currentIndex: number, newIndex: number) => void;
  index: number;
  totalItems: number;
}

export function MovableBadge({
  children,
  className,
  onRemove,
  onDragStart,
  onDragEnd,
  index,
  totalItems,
  ...props
}: MovableBadgeProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const badgeRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on the remove button
    if ((e.target as HTMLElement).closest('[data-remove-button="true"]')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    },
    [isDragging]
  );

  const handleMouseUp = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !badgeRef.current) return;

      // Find all badge elements to determine drop position
      const container = badgeRef.current.parentElement;
      if (container) {
        const badges = Array.from(
          container.querySelectorAll("[data-badge-index]")
        );

        // Find the closest badge to drop position
        let closestIndex = index;
        let closestDistance = Number.MAX_VALUE;

        badges.forEach((badge) => {
          const badgeIndex = parseInt(
            badge.getAttribute("data-badge-index") || "-1"
          );
          if (badgeIndex !== index && badgeIndex >= 0) {
            const rect = badge.getBoundingClientRect();
            const badgeCenterX = rect.left + rect.width / 2;
            const badgeCenterY = rect.top + rect.height / 2;

            const distance = Math.sqrt(
              Math.pow(e.clientX - badgeCenterX, 2) +
                Math.pow(e.clientY - badgeCenterY, 2)
            );

            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = badgeIndex;
            }
          }
        });

        // Notify parent of the reordering
        if (closestIndex !== index) {
          onDragEnd?.(index, closestIndex);
        }
      }

      setIsDragging(false);
    },
    [isDragging, index, onDragEnd]
  );

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Set a cursor style on the document during drag
      document.body.style.cursor = "grabbing";
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Restore cursor
      document.body.style.cursor = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={badgeRef}
      className={cn(
        "inline-flex mr-2 mb-2 transition-opacity duration-200",
        isDragging && "opacity-40" // Reduce opacity during drag
      )}
      onMouseDown={handleMouseDown}
      data-badge-index={index}
    >
      <Badge
        {...props}
        className={cn(
          "pr-6 relative select-none cursor-grab",
          isDragging && "cursor-grabbing",
          props.className
        )}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-secondary-foreground/20"
            onClick={onRemove}
            data-remove-button="true"
            aria-label="Remove"
          >
            ×
          </button>
        )}
      </Badge>
    </div>
  );
}
