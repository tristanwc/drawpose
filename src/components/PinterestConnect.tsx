import { LogIn, LogOut } from 'lucide-react'
import { apiUrl } from '../lib/api'

type Props = {
  authenticated: boolean
  onLogout: () => void
}

export function PinterestConnect({ authenticated, onLogout }: Props) {
  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Connected
        </span>
        <button
          onClick={onLogout}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <a
      href={apiUrl('/auth/login')}
      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      <LogIn size={14} />
      Connect Pinterest
    </a>
  )
}
