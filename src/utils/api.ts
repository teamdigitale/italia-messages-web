export const DEFAULT_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.cd.italia.it/api/v1"
    : "http://localhost:3000";

export function getUrl() {
  const { localStorage } = window;
  const serviceEndpoint = localStorage.getItem("serviceEndpoint");

  return serviceEndpoint ? serviceEndpoint : DEFAULT_URL;
}

const getOptions = (dbName: string) => {
  return {
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": dbName || localStorage.getItem("serviceKey")
    }
  };
};

const getRetryTimeout = (message: string) => {
  try {
    const messageMatch = message.match(/\d+ seconds/g);
    if (!messageMatch) {
      throw new Error();
    }
    const messageString = messageMatch[0];
    const stringMatch = messageString.match(/\d+/);
    if (!stringMatch) {
      throw new Error();
    }
    const digits = Number(stringMatch[0]);
    return isFinite(digits) ? digits * 1000 : 1 * 1000;
  } catch (error) {
    return 1 * 1000;
  }
};

interface GetParams {
  dbName?: any;
  url?: any;
  path: any;
  options?: any;
}

export function get(params: GetParams) {
  const { dbName, url, path, options } = params;
  return fetch(`${url || getUrl()}/${path}`, {
    ...getOptions(dbName),
    ...options,
    method: "GET"
  })
    .then(response => response.json())
    .then(response => {
      // The API returned an error with shape { message, statusCode }
      if (response.statusCode === 429) {
        // { statusCode: 429, message: "Rate limit is exceeded. Try again in X seconds." }
        // Attempt to retry
        return new Promise<any>(resolve => {
          setTimeout(async () => {
            const result = await get({
              dbName,
              url,
              path,
              options
            });
            resolve(result);
          }, getRetryTimeout(response.message));
        });
      }
      return response;
    });
}

interface PostParams {
  dbName?: any;
  url?: any;
  path: any;
  options: any;
}

export function post(params: PostParams) {
  const { dbName, url, path, options } = params;
  return fetch(`${url || getUrl()}/${path}`, {
    ...getOptions(dbName),
    ...options,
    method: "POST",
    body: JSON.stringify(options.body)
  })
    .then(response => response.json())
    .then(response => {
      // The API returned an error with shape { message, statusCode }
      if (response.statusCode === 429) {
        // { statusCode: 429, message: "Rate limit is exceeded. Try again in X seconds." }
        // Attempt to retry
        return new Promise<any>(resolve => {
          setTimeout(async () => {
            const result = await post({
              dbName,
              url,
              path,
              options
            });
            resolve(result);
          }, getRetryTimeout(response.message));
        });
      }
      return response;
    });
}

export default { DEFAULT_URL, getUrl, get, post };
