const HOST = window.localStorage.getItem('host') || window.location.hostname
const PORT = 80

export const API_URL = `http://${HOST}:${PORT}`
export const WS_URL = `ws://${HOST}:${PORT}`
export const COLORS = [
  '#EB5757', '#F2994A', '#F2C94C', '#219653', '#6FCF97', '#2F80ED',
  '#2D9CDB', '#56CCF2', '#9B51E0'
]

export const MAX_LENGTH = 7 * 24 * 60 * 60