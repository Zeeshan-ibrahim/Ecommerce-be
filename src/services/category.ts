import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { slugify } from "@/utils/slug";

export type CreateCategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
};

export function parseCreateCategoryBody(
  body: Record<string, unknown>
): CreateCategoryInput {
  const name = String(body.name ?? "").trim();
  if (!name) {
    throw new Error("name is required");
  }

  return {
    name,
    slug: body.slug ? String(body.slug).trim() : undefined,
    description: body.description ? String(body.description) : undefined,
    parentId: body.parentId ? String(body.parentId) : undefined,
  };
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = slugify(input.slug ?? input.name);
  if (!slug) {
    throw new Error("Could not generate a valid slug from name");
  }

  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        parentId: input.parentId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Category slug already exists");
    }
    throw error;
  }
}
