'use client'

import Link from 'next/link'

type Props = {
  initials: string
}

export function NavAuthLinks({ initials }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors"
      >
        Dashboard
      </Link>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D52A0] text-xs font-bold text-white select-none"
        title="Profile"
      >
        {initials}
      </div>
    </div>
  )
}
