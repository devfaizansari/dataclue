import { ApiError } from "@/lib/api";
import type { BlogListResponse, BlogPost } from "@/lib/types/blog";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/adminAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type BlogPayload = Omit<BlogPost, "id">;

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
    throw new ApiError(body.detail ?? detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  const data = await request<BlogListResponse>("/blogs");
  return data.blogs;
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

export async function fetchAdminBlogs(): Promise<BlogPost[]> {
  const data = await request<BlogListResponse>("/admin/blogs", undefined, true);
  return data.blogs;
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
  const response = await fetch(`${API_BASE}/blogs`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as BlogListResponse;
  return data.blogs;
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
