// js/utils.js
export function sanitizeTrackId(str) {
  return str
    .toLowerCase()
    .replace(/&/g, '-and-') // Replace & with -and-
    .replace(/,/g, '') // Remove commas
    .replace(/[^a-z0-9]+/g, '-') // Replace other special chars with -
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}