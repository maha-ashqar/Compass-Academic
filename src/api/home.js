const API_URL = import.meta.env.VITE_API_URL;

export async function getHomeData() {
  const response = await fetch(`${API_URL}/home`, {
    headers: {
      Accept: 'application/json',
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        'Unable to load home page data.'
    );
  }

  return data;
}