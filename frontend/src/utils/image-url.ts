type BookImageLike = {
  mainImage?: string;
  imageUrl?: string[];
};

const DEFAULT_FALLBACK = "/images/fallback_img.png";

function hasProtocol(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function trimRightSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveImageUrl(
  rawUrl?: string,
  fallback: string = DEFAULT_FALLBACK
): string {
  if (!rawUrl) {
    return fallback;
  }

  if (hasProtocol(rawUrl) || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }

  // Static assets in /public should be used directly.
  if (rawUrl.startsWith("/images/")) {
    return rawUrl;
  }

  const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  if (!apiOrigin) {
    return rawUrl;
  }

  const base = trimRightSlash(apiOrigin);
  if (rawUrl.startsWith("/")) {
    return `${base}${rawUrl}`;
  }

  return `${base}/${rawUrl}`;
}

export function resolveBookCover(book?: BookImageLike): string {
  return resolveImageUrl(book?.mainImage || book?.imageUrl?.[0]);
}
