import { ApiError } from "@/lib/api";
import type { BlogListParams, BlogListResponse, BlogPost } from "@/lib/types/blog";
import { ADMIN_BLOGS_PAGE_SIZE, PUBLIC_BLOGS_PAGE_SIZE } from "@/lib/types/blog";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/adminAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type BlogPayload = Omit<BlogPost, "id">;

function buildBlogListQuery(params?: BlogListParams): string {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.search?.trim()) searchParams.set("search", params.search.trim());
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getAdminToken();
    if (!token) {
      throw new ApiError("Admin authentication required", 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearAdminToken();
    }

    let detail = "Request failed";
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchPublishedBlogs(
  params: BlogListParams = { page: 1, pageSize: PUBLIC_BLOGS_PAGE_SIZE },
): Promise<BlogListResponse> {
  return request<BlogListResponse>(`/blogs${buildBlogListQuery(params)}`);
}

export async function fetchPublishedBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await request<BlogPost>(`/blogs/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const data = await request<{ access_token: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAdminToken(data.access_token);
}

export function adminLogout(): void {
  clearAdminToken();
}

export async function fetchAdminProfile(): Promise<{ username: string }> {
  return request<{ username: string }>("/admin/me", undefined, true);
}

export async function updateAdminCredentials(payload: {
  current_password: string;
  new_username?: string;
  new_password?: string;
}): Promise<{ username: string; access_token: string; message: string }> {
  const data = await request<{
    username: string;
    access_token: string;
    message: string;
  }>(
    "/admin/credentials",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true,
  );
  setAdminToken(data.access_token);
  return data;
}

export async function fetchAdminBlogs(
  params: BlogListParams = { page: 1, pageSize: ADMIN_BLOGS_PAGE_SIZE },
): Promise<BlogListResponse> {
  return request<BlogListResponse>(`/admin/blogs${buildBlogListQuery(params)}`, undefined, true);
}

export async function fetchAdminBlogById(id: string): Promise<BlogPost> {
  return request<BlogPost>(`/admin/blogs/${id}`, undefined, true);
}

export async function createBlog(payload: BlogPayload): Promise<BlogPost> {
  return request<BlogPost>(
    "/admin/blogs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export async function updateBlog(id: string, payload: Partial<BlogPayload>): Promise<BlogPost> {
  return request<BlogPost>(
    `/admin/blogs/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export async function deleteBlog(id: string): Promise<void> {
  await request<void>(
    `/admin/blogs/${id}`,
    {
      method: "DELETE",
    },
    true,
  );
}

export async function fetchPublishedBlogsServer(): Promise<BlogPost[]> {
  const allBlogs: BlogPost[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(
      `${API_BASE}/blogs${buildBlogListQuery({ page, pageSize: 50 })}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) {
      break;
    }
    const data = (await response.json()) as BlogListResponse;
    allBlogs.push(...data.blogs);
    totalPages = data.totalPages;
    page += 1;
  } while (page <= totalPages);

  return allBlogs;
}

export async function fetchPublishedBlogBySlugServer(slug: string): Promise<BlogPost | null> {
  const response = await fetch(`${API_BASE}/blogs/${slug}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to load blog");
  }
  return response.json() as Promise<BlogPost>;
}
