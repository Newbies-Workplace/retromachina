import { BadRequestException } from "@nestjs/common";
import type {
  WarmupLink,
  WarmupLinkRequest,
  WarmupLinkResponse,
} from "shared/model/warmup/warmup";
import type { PrismaService } from "../prisma/prisma.service";

export const DEFAULT_WARMUPS: WarmupLinkResponse[] = [
  {
    id: "default-gartic-phone",
    name: "Gartic Phone",
    description: "Rysunkowy głuchy telefon dla całego zespołu.",
    url: "https://garticphone.com/",
    source: "default",
  },
  {
    id: "default-skribbl",
    name: "skribbl.io",
    description: "Wspólne rysowanie i zgadywanie haseł.",
    url: "https://skribbl.io/",
    source: "default",
  },
  {
    id: "default-openguessr",
    name: "OpenGuessr",
    description: "Wspólne zgadywanie lokalizacji z całego świata.",
    url: "https://openguessr.com/multiplayer/host",
    source: "default",
  },
];

export async function getEffectiveWarmups(
  prisma: PrismaService,
  teamId: string,
): Promise<WarmupLinkResponse[]> {
  const links = await prisma.warmupLink.findMany({
    where: { team_id: teamId },
    orderBy: { name: "asc" },
  });
  if (links.length === 0) return DEFAULT_WARMUPS;
  return links.map(({ id, name, description, url }) => ({
    id,
    name,
    description,
    url,
    source: "team" as const,
  }));
}

export function validateWarmupLink(request: WarmupLinkRequest): WarmupLink {
  const name = request.name?.trim();
  const description = request.description?.trim() || null;
  const url = request.url?.trim();
  if (!name || name.length > 191) {
    throw new BadRequestException("Warmup name is required");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException("Warmup URL is invalid");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BadRequestException("Warmup URL must use HTTP or HTTPS");
  }
  return { id: "", name, description, url: parsed.toString() };
}
