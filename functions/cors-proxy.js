/**
 * Cloudflare Worker: CORS Proxy for GitHub Releases
 * 这个 Worker 作为 CORS 代理，允许从 GitHub Releases 加载模型文件
 */

export default {
  async fetch(request, env, ctx) {
    // 只允许 GET 请求
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 获取目标 URL
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    try {
      // 从目标 URL 获取资源
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CORS-Proxy)',
        },
      });

      if (!response.ok) {
        return new Response(`Failed to fetch: ${response.status} ${response.statusText}`, {
          status: response.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // 获取响应体
      const data = await response.arrayBuffer();

      // 创建新的响应，添加 CORS 头
      const newResponse = new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Length': response.headers.get('Content-Length') || data.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });

      return newResponse;
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};

