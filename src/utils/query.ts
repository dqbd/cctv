type IQuery = string | number | boolean | undefined | null

export const encodeQuery = (
  url: string,
  args: { [key: string]: IQuery } = {}
): string => {
  const [baseUrl, search] = url.split("?")
  const params = [
    ...new URLSearchParams("?" + (search ?? "")).entries(),
  ].reduce<Record<string, IQuery>>((memo, [key, value]) => {
    memo[key] = memo[key] ?? value
    return memo
  }, args)

  const query = Object.entries<IQuery>(params)
    .filter((pair): pair is [string, NonNullable<IQuery>] => {
      return pair[1] != null && pair[1] !== ""
    })
    .map((pair) => pair.map(encodeURIComponent).join("="))

  if (query.length > 0) {
    return `${baseUrl}?${query.join("&")}`
  }

  return url
}
