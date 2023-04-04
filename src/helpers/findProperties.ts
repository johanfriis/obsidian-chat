export function findProperties(
  content: string[]
): { start: number; end: number } | null {
  let propertyIndices = [];

  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    if (line === "") {
      continue;
    }

    if (line.match(/^[a-zA-Z_]+::/)) {
      propertyIndices.push(i);
      continue;
    }

    break;
  }

  // return the first and last value of propertyIndices or null if it's empty
  return propertyIndices.length > 0
    ? {
        start: propertyIndices[0],
        end: propertyIndices[propertyIndices.length - 1],
      }
    : null;
}
