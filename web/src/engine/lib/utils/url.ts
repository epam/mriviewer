/**
 * Checks if a given string is a valid URL with http or https protocol.
 * @param {string} urlString - The string to be checked.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
const isValidUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Extracts the file name from a URL.
 * @param {string} url - The URL from which to extract the file name.
 * @returns {string} The file name, or an empty string if the URL is invalid.
 */
const getFileNameFromUrl = (url: string) => {
  const lastSlashIndex = Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\'));
  if (lastSlashIndex < 0) {
    console.warn('getFileNameFromUrl: wrong URL!');
    return '';
  }
  const strFileName = url.substring(lastSlashIndex + 1);
  const MAX_LEN = 40;
  return strFileName.length <= MAX_LEN ? strFileName : strFileName.substring(0, MAX_LEN);
};

/**
 * Extracts the folder name from a URL.
 * @param {string} url - The URL from which to extract the folder name.
 * @returns {string} The folder name, or an empty string if the URL is invalid.
 */
const getFolderNameFromUrl = (url: string) => {
  const lastSlashIndex = Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\'));
  if (lastSlashIndex < 0) {
    console.warn('getFolderNameFromUrl: wrong URL!');
    return '';
  }
  return url.substring(0, lastSlashIndex);
};

/**
 * Extracts the extension from a URL.
 * @param {string} url - The URL from which to extract the extension.
 * @returns {string} The extracted extension.
 */
const getExtensionFromUrl = (url: string) => {
  const lastDotIndex = url.lastIndexOf('.');
  if (lastDotIndex < 0) {
    console.warn('getExtensionFromUrl: No extension found in URL!');
    return '';
  }
  return url.slice(lastDotIndex + 1);
};

export { isValidUrl, getFileNameFromUrl, getFolderNameFromUrl, getExtensionFromUrl };
