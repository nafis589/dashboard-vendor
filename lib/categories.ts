import { api } from '@/lib/api-client';

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children: StoreCategory[];
}

interface CategoriesResponse {
  data: StoreCategory[];
}

export async function fetchStoreCategories(): Promise<StoreCategory[]> {
  const res = await api.get<CategoriesResponse>('/api/store/categories');
  return res.data;
}

export function flattenTopLevelCategories(tree: StoreCategory[]): StoreCategory[] {
  return tree;
}

export function getSubcategories(tree: StoreCategory[], parentId: string): StoreCategory[] {
  const parent = findCategoryById(tree, parentId);
  return parent?.children ?? [];
}

export function findCategoryById(tree: StoreCategory[], id: string): StoreCategory | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findCategoryById(node.children, id);
    if (found) return found;
  }
  return null;
}

export function resolveCategoryId(
  tree: StoreCategory[],
  categoryId: string,
  subcategoryId?: string | null,
): string {
  if (subcategoryId) return subcategoryId;
  return categoryId;
}

/** Split a leaf category id into parent + subcategory for the form */
export function splitCategoryForForm(
  tree: StoreCategory[],
  leafId: string | null | undefined,
): { category_id: string; subcategory_id: string | null } {
  if (!leafId) return { category_id: '', subcategory_id: null };

  for (const root of tree) {
    if (root.id === leafId) {
      return { category_id: root.id, subcategory_id: null };
    }
    const child = root.children.find((c) => c.id === leafId);
    if (child) {
      return { category_id: root.id, subcategory_id: child.id };
    }
  }

  return { category_id: leafId, subcategory_id: null };
}
