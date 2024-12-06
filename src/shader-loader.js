export async function loadShaderSource(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${url}`);
    }
    return await response.text();
  }
  