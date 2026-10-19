import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {usePathname} from 'next/navigation'
import {decryptData} from './encryptionData'

const useRestrictedPage = (token: any) => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    let authorize_url = localStorage.getItem('o8g4z3q9f1v5e2n7k6t')
    authorize_url = authorize_url ? decryptData(authorize_url) : null
    // console.log('authorize_url : ', authorize_url);
    if (!authorize_url) return
    const authorizeList = JSON.parse(authorize_url || '[]')

    const isRestrictedPage = (pathname: string) => {

      const isEventTemplateHistory = pathname.endsWith('/authorization/dam/parameters/systemConfiguration/eventTemplate/history')

      const isAuthorizedPath = authorizeList.includes(pathname)

      return isAuthorizedPath || isEventTemplateHistory
    }

    if (isRestrictedPage(pathname) && !token) {
      // Access denied. Redirecting to signin...
      router.replace(`/en/signin`)
    } else if (!isRestrictedPage(pathname) && token) {
      // console.log('pathname : ', pathname);
      // Access restricted. Redirecting to authorization...
      router.push(`/en/authorization`)
    }
  }, [pathname, token, router])
}

export default useRestrictedPage
