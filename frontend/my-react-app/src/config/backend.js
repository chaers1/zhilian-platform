export const DJANGO_HOST = import.meta.env.VITE_DJANGO_HOST || '127.0.0.1'
export const DJANGO_PORT = import.meta.env.VITE_DJANGO_PORT || '8000'
export const DJANGO_BASE_URL = `http://${DJANGO_HOST}:${DJANGO_PORT}/`

export const FASTAPI_HOST = import.meta.env.VITE_FASTAPI_HOST || '127.0.0.1'
export const FASTAPI_PORT = import.meta.env.VITE_FASTAPI_PORT || '8001'
export const FASTAPI_BASE_URL = `http://${FASTAPI_HOST}:${FASTAPI_PORT}/`

export const getFullAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl === 'none' || avatarUrl === '') {
        return null
    }
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl
    }
    if (avatarUrl.startsWith('/')) {
        return `${DJANGO_BASE_URL}${avatarUrl.slice(1)}`
    }
    return `${DJANGO_BASE_URL}${avatarUrl}`
}
