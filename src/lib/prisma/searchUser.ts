/**
 * Use this function when searching a user from a given
 * `search` query string parameter.
 */
export function searchUser(search: string) {
  return {
    OR: [
      {
        name: {
          contains: search.trim(),
          mode: 'insensitive' as const,
        },
      },
      {
        username: {
          contains: search.trim(),
          mode: 'insensitive' as const,
        },
      },
    ],
  };
}
