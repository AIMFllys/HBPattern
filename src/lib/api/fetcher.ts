import type { ApiSuccess, PaginatedResponse, ApiError } from './response'

export class FetchError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
    this.name = 'FetchError'
  }
}

/**
 * 统一 fetch 封装，自动解析 API 响应类型。
 * 成功返回 data，失败抛 FetchError。
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()

  if (!res.ok) {
    const err = json as ApiError
    throw new FetchError(
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? '请求失败',
      res.status,
    )
  }

  // 判断是分页响应还是单资源响应
  if ('pagination' in json) {
    return json as T
  }
  return (json as ApiSuccess<T>).data
}

/** 获取分页响应的完整结构（含 pagination meta） */
export async function apiFetchPaginated<T>(url: string, init?: RequestInit): Promise<PaginatedResponse<T>> {
  const res = await fetch(url, init)
  const json = await res.json()

  if (!res.ok) {
    const err = json as ApiError
    throw new FetchError(
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? '请求失败',
      res.status,
    )
  }

  return json as PaginatedResponse<T>
}
