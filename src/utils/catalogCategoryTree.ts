export type CatalogCategoryNode = {
  slug: string
  name: string
  children: CatalogCategoryNode[]
  id?: number
}

type FlatCategory = {
  slug: string
  name: string
  id?: number | string
  parent_id?: number | string | null
  parent?: { id?: number | string; slug?: string } | number | string | null
}

type CategoryIndexEntry = {
  name: string
  parentSlug: string | null
  rootSlug: string
}

export type FlatCategoryHit = {
  slug: string
  name: string
  rootSlug: string
  pathLabel: string
  depth: number
  id?: number
}

/**
 * Parse public nested tree, or rebuild from a flat admin-style list when `children` are missing.
 */
export function parseCategoryListResponse(data: unknown): CatalogCategoryNode[] {
  const roots = Array.isArray(data) ? data : ((data as { results?: unknown[] })?.results ?? [])
  if (!Array.isArray(roots) || !roots.length) return []

  const hasNestedChildren = roots.some((raw) => {
    const n = raw as Record<string, unknown>
    const kids = n.children ?? n.subcategories
    return Array.isArray(kids) && kids.length > 0
  })
  const looksFlatWithParents = roots.some((raw) => {
    const n = raw as Record<string, unknown>
    return n.parent_id != null && n.parent_id !== '' && n.parent_id !== 0
  })

  if (!hasNestedChildren && looksFlatWithParents) {
    return buildCategoryTreeFromFlat(roots as Parameters<typeof buildCategoryTreeFromFlat>[0])
  }
  return normalizeTreeNodes(roots)
}

function normalizeTreeNodes(nodes: unknown[]): CatalogCategoryNode[] {
  return (nodes || [])
    .map((raw) => {
      const n = raw as Record<string, unknown>
      const slug = String(n.slug ?? '').trim()
      const name = String(n.name ?? slug).trim()
      const id = n.id != null && n.id !== '' ? Number(n.id) : undefined
      const childrenRaw = n.children ?? n.subcategories ?? []
      const children = Array.isArray(childrenRaw) ? normalizeTreeNodes(childrenRaw) : []
      return { slug, name, children, id: Number.isFinite(id) ? id : undefined }
    })
    .filter((n) => n.slug && n.name)
}

export function buildCategoryTreeFromFlat(flat: FlatCategory[]): CatalogCategoryNode[] {
  const byId = new Map<string, CatalogCategoryNode>()
  const parentById = new Map<string, string | null>()

  for (const row of flat) {
    const slug = String(row.slug ?? '').trim()
    const name = String(row.name ?? slug).trim()
    if (!slug || !name) continue
    const id = String(row.id ?? slug)
    const numericId = row.id != null && row.id !== '' ? Number(row.id) : undefined
    byId.set(id, {
      slug,
      name,
      children: [],
      id: Number.isFinite(numericId) ? numericId : undefined,
    })
    let parentId: string | null = null
    if (row.parent_id != null && row.parent_id !== '') {
      parentId = String(row.parent_id)
    } else if (row.parent != null && typeof row.parent === 'object' && 'id' in row.parent) {
      const pid = (row.parent as { id?: number | string }).id
      if (pid != null && pid !== '') parentId = String(pid)
    }
    parentById.set(id, parentId)
  }

  const roots: CatalogCategoryNode[] = []
  for (const row of flat) {
    const id = String(row.id ?? row.slug)
    const node = byId.get(id)
    if (!node) continue
    const parentId = parentById.get(id)
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: CatalogCategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
}

export function buildCategoryIndex(roots: CatalogCategoryNode[]): Map<string, CategoryIndexEntry> {
  const index = new Map<string, CategoryIndexEntry>()

  const walk = (nodes: CatalogCategoryNode[], parentSlug: string | null, rootSlug: string) => {
    for (const n of nodes) {
      const root = parentSlug === null ? n.slug : rootSlug
      index.set(n.slug, { name: n.name, parentSlug, rootSlug: root })
      walk(n.children, n.slug, root)
    }
  }
  walk(roots, null, '')

  return index
}

export function getRootSlug(index: Map<string, CategoryIndexEntry>, slug: string): string | null {
  const meta = index.get(slug)
  return meta?.rootSlug || (meta?.parentSlug === null ? slug : null) || null
}

export function isUnderRoot(index: Map<string, CategoryIndexEntry>, slug: string, rootSlug: string): boolean {
  if (slug === rootSlug) return true
  let cur = index.get(slug)
  while (cur) {
    if (cur.rootSlug === rootSlug) return true
    if (!cur.parentSlug) return false
    cur = index.get(cur.parentSlug)
  }
  return false
}

export function splitSlugsToMainAndSubs(
  roots: CatalogCategoryNode[],
  slugs: string[]
): { main: string | null; subs: string[] } {
  const cleaned = [...new Set(slugs.map((s) => String(s).trim()).filter(Boolean))]
  if (!cleaned.length) return { main: null, subs: [] }

  const index = buildCategoryIndex(roots)
  let main: string | null = null
  const subs: string[] = []

  for (const slug of cleaned) {
    const meta = index.get(slug)
    if (!meta) continue
    const rootSlug = meta.parentSlug === null ? slug : meta.rootSlug
    if (!main) main = rootSlug
    if (slug !== rootSlug && isUnderRoot(index, slug, main)) {
      subs.push(slug)
    }
  }

  if (main && subs.length === 0 && cleaned.includes(main)) {
    return { main, subs: [] }
  }

  if (!main && cleaned.length) {
    const first = cleaned[0]
    const meta = index.get(first)
    const rootSlug = meta ? (meta.parentSlug === null ? first : meta.rootSlug) : first
    return {
      main: rootSlug,
      subs: cleaned.filter((s) => s !== rootSlug),
    }
  }

  return { main, subs: [...new Set(subs)] }
}

/** Compare slug lists ignoring order (for v-model sync without update loops). */
export function categorySlugsEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  const sa = [...new Set((a ?? []).map((s) => s.trim()).filter(Boolean))].sort()
  const sb = [...new Set((b ?? []).map((s) => s.trim()).filter(Boolean))].sort()
  if (sa.length !== sb.length) return false
  return sa.every((s, i) => s === sb[i])
}

export function combineMainAndSubs(main: string | null | undefined, subs: string[]): string[] {
  const subList = [...new Set(subs.map((s) => s.trim()).filter(Boolean))]
  const m = String(main ?? '').trim()
  // Prefer leaf selections only; main is implied by the tree when subs are present.
  if (subList.length) return subList
  return m ? [m] : []
}

export function findCategoryNode(roots: CatalogCategoryNode[], slug: string): CatalogCategoryNode | null {
  for (const root of roots) {
    if (root.slug === slug) return root
    const found = findCategoryNode(root.children, slug)
    if (found) return found
  }
  return null
}

export function getCategoryDescendants(node: CatalogCategoryNode): Array<{ slug: string; name: string; depth: number }> {
  const out: Array<{ slug: string; name: string; depth: number }> = []
  const walk = (children: CatalogCategoryNode[], depth: number) => {
    for (const c of children) {
      out.push({ slug: c.slug, name: c.name, depth })
      walk(c.children, depth + 1)
    }
  }
  walk(node.children, 1)
  return out
}

/** Flatten tree for global search (main + all nested). */
export function flattenCategories(roots: CatalogCategoryNode[]): FlatCategoryHit[] {
  const out: FlatCategoryHit[] = []
  const walk = (nodes: CatalogCategoryNode[], pathNames: string[], rootSlug: string) => {
    for (const n of nodes) {
      const nextPath = [...pathNames, n.name]
      const nextRoot = pathNames.length === 0 ? n.slug : rootSlug
      out.push({
        slug: n.slug,
        name: n.name,
        rootSlug: nextRoot,
        pathLabel: nextPath.join(' › '),
        depth: pathNames.length,
        id: n.id,
      })
      walk(n.children, nextPath, nextRoot)
    }
  }
  walk(roots, [], '')
  return out
}

export function filterCategoriesByQuery<T extends { slug: string; name: string; pathLabel?: string; label?: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  const terms = q.split(/\s+/).filter(Boolean)
  return items.filter((c) => {
    const hay = [c.name, c.slug, c.pathLabel ?? '', c.label ?? ''].join(' ').toLowerCase()
    return terms.every((term) => hay.includes(term))
  })
}
