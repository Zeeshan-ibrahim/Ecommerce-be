import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { uploadImage } from "@/utils/cloudinaryUpload";
import { resolveUniqueSlug, slugify } from "@/utils/slug";

export type CreateProductInput = {
  name: string;
  slug?: string;
  description?: string;
  sku: string;
  pricePaisas: number;
  comparePrice?: number;
  categoryId: string;
  brand?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
};

export type ProductImageInput = {
  buffer?: Buffer;
  url?: string;
  alt?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

async function ensureUniqueSlug(base: string): Promise<string> {
  const existing = await prisma.product.findMany({
    where: {
      OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }],
    },
    select: { slug: true },
  });

  return resolveUniqueSlug(
    base,
    existing.map((product) => product.slug)
  );
}

function parseTags(value: unknown): string[] {
  if (value == null || value === "") {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed) as string[];
    }
    return trimmed.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function parseCreateProductBody(
  body: Record<string, unknown>
): CreateProductInput {
  const name = String(body.name ?? "").trim();
  const sku = String(body.sku ?? "").trim();
  const categoryId = String(body.categoryId ?? "").trim();
  const pricePaisas = Number(body.pricePaisas);

  if (!name || !sku || !categoryId || !Number.isInteger(pricePaisas) || pricePaisas < 0) {
    throw new Error(
      "name, sku, categoryId, and pricePaisas (non-negative integer) are required"
    );
  }

  const comparePrice =
    body.comparePrice != null && body.comparePrice !== ""
      ? Number(body.comparePrice)
      : undefined;

  if (comparePrice != null && (!Number.isInteger(comparePrice) || comparePrice < 0)) {
    throw new Error("comparePrice must be a non-negative integer");
  }

  return {
    name,
    slug: body.slug ? String(body.slug).trim() : undefined,
    description: body.description ? String(body.description) : undefined,
    sku,
    pricePaisas,
    comparePrice,
    categoryId,
    brand: body.brand ? String(body.brand) : undefined,
    isActive: body.isActive === undefined ? true : body.isActive === true || body.isActive === "true",
    isFeatured:
      body.isFeatured === true || body.isFeatured === "true",
    tags: parseTags(body.tags),
    metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
    metaDescription: body.metaDescription
      ? String(body.metaDescription)
      : undefined,
  };
}

export type ImageMeta = {
  alt?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

export function parseProductImagesFromBody(
  body: Record<string, unknown>
): ProductImageInput[] {
  const raw = body.images ?? body.imageUrls;

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      "images is required: array of image URLs or { url, alt?, isPrimary?, sortOrder? }"
    );
  }

  return raw.map((entry, index) => {
    if (typeof entry === "string") {
      const url = entry.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw new Error(`images[${index}] must be a valid http(s) URL`);
      }
      return { url, sortOrder: index };
    }

    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const url = String(obj.url ?? "").trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw new Error(`images[${index}].url must be a valid http(s) URL`);
      }
      return {
        url,
        alt: obj.alt != null ? String(obj.alt) : undefined,
        sortOrder: obj.sortOrder != null ? Number(obj.sortOrder) : index,
        isPrimary: obj.isPrimary === true,
      };
    }

    throw new Error(`images[${index}] must be a URL string or object with url`);
  });
}

export function parseImageMeta(value: unknown): ImageMeta[] {
  if (value == null || value === "") {
    return [];
  }
  const parsed =
    typeof value === "string" ? (JSON.parse(value) as ImageMeta[]) : (value as ImageMeta[]);
  if (!Array.isArray(parsed)) {
    throw new Error("imageMeta must be a JSON array");
  }
  return parsed;
}

export async function createProduct(
  input: CreateProductInput,
  images: ProductImageInput[]
) {
  if (images.length === 0) {
    throw new Error("At least one product image is required");
  }

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (!image.buffer && !image.url) {
      throw new Error(`images[${index}] must include a file or url`);
    }
  }

  const baseSlug = slugify(input.slug ?? input.name);
  if (!baseSlug) {
    throw new Error("Could not generate a valid slug from name");
  }

  const [category, slug] = await Promise.all([
    prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true, name: true, slug: true },
    }),
    ensureUniqueSlug(baseSlug),
  ]);

  if (!category) {
    throw new Error("Category not found");
  }

  const uploads = await Promise.all(
    images.map((image, index) => {
      const source = image.buffer ?? image.url!;
      return uploadImage(source, {
        folder: "products",
        public_id: `${slug}-${index}`,
      });
    })
  );

  const hasPrimary = images.some((img) => img.isPrimary);

  const imagesData = uploads.map((result, index) => {
    const meta = images[index];
    return {
      url: result.secure_url,
      alt: meta.alt ?? input.name,
      sortOrder: meta.sortOrder ?? index,
      isPrimary: meta.isPrimary ?? (!hasPrimary && index === 0),
    };
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          sku: input.sku,
          pricePaisas: input.pricePaisas,
          comparePrice: input.comparePrice,
          categoryId: input.categoryId,
          brand: input.brand,
          isActive: input.isActive ?? true,
          isFeatured: input.isFeatured ?? false,
          tags: input.tags ?? [],
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
        },
      });

      const createdImages = await tx.productImage.createManyAndReturn({
        data: imagesData.map((image) => ({
          productId: product.id,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        }))
      });

      return {
        ...product,
        images: createdImages,
        category,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error("Category not found");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const field = (error.meta?.target as string[] | undefined)?.join(", ");
      throw new Error(field ? `Duplicate value for: ${field}` : "Duplicate product field");
    }
    throw error;
  }
}
