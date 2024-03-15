export const TARGET_SEPARATOR = ":";

export class Address {
  /**
   *
   * @param path The path from the build root to the directory containing the BUILD file for the target.
   * @param targetName The name of the target. For generated targets, this is the name of its target generator.
   */
  constructor(
    readonly path: string,
    readonly targetName: string
  ) {}

  get address(): string {
    return `${this.path}:${this.targetName}`;
  }

  /**
   * Parse a string into an Address.
   *
   * @param spec Target address spec. For example, `src/helloworld:mylib`.
   * @returns An Address object.
   */
  static parse(spec: string): Address {
    const addr = spec.split(TARGET_SEPARATOR);
    const path = addr[0]
    const targetName = addr[1]
    return new Address(path, targetName);
  }
}

/**
 * A utility method to check if a string is a valid address.
 *
 * @param spec Target address spec. For example, `src/helloworld:mylib`.
 * @returns True if the spec is a valid address, false otherwise.
 */
export function isAddress(spec: string): boolean {
  return spec.includes(TARGET_SEPARATOR);
}

/**
 * A utility method to check if a string is a valid global address. A global address is an address that
 * starts with `//`.
 *
 * @param spec Target address spec. For example, `//src/helloworld:mylib`.
 * @returns True if the spec is a valid global address, false otherwise.
 */
export function isGlobalAddress(spec: string): boolean {
  return spec.startsWith("//") && isAddress(spec);
}
