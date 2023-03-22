export function cleanTitle(title: string, documentTitle: boolean) {
  // remove any list decoration and any surrounding quotes
  // if documentTitle, transform any :, \, /
  title = title.replace(/^-\s*/, "");
  title = title.replace(/^\d+\.?\s*/, "");

  const titleLength = title.length;
  title = title.replace(/^["']/, "");
  // if we removed a " from the beginning, try to remove one from the end
  if (titleLength > title.length) {
    title = title.replace(/["']$/, "");
  }

  if (documentTitle) {
    title = title.replace(/\s*:+\s*/g, " - ");
    title = title.replace(/\s*\\+\s*/g, " - ");
    title = title.replace(/\s*\/+\s*/g, ", ");
  }
  return title.trim();
}
