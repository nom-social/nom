import { toast } from "sonner";

/**
 * useShare returns a function that shares a given url (and optional title) using the Web Share API if available and on mobile,
 * or copies the url to the clipboard as a fallback. Shows a toast for success or error.
 */
export function useShare() {
  return async function share(url: string, title?: string) {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share(title ? { url, title } : { url });
        toast.success("Link shared!");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          toast.error("Failed to share link.");
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link.");
      }
    } else {
      // fallback for very old browsers
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link.");
      }
    }
  };
}
