import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";

/**
 * Extracts the display title from a feed/status item based on its type.
 * Returns null when parsing fails or for unsupported types.
 */
export function getStatusItemTitle(item: {
  type: string;
  data: unknown;
}): string | null {
  if (item.type === "pull_request") {
    const parsed = prDataSchema.safeParse(item.data);
    if (parsed.success) return parsed.data.pull_request.title;
    return null;
  }
  if (item.type === "release") {
    const parsed = releaseDataSchema.safeParse(item.data);
    if (parsed.success)
      return parsed.data.release.name ?? parsed.data.release.tag_name;
    return null;
  }
  if (item.type === "push") {
    const parsed = pushDataSchema.safeParse(item.data);
    if (parsed.success) return parsed.data.push.title;
    return null;
  }
  return null;
}
