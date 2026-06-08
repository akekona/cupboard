'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Box } from 'lucide-react'

interface NotFoundProps {
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function NotFound({
  title = 'Not found',
  description = "This resource doesn't exist or has been deleted.",
  backHref,
  backLabel = 'Go back',
}: NotFoundProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="w-9 h-9 bg-[#3B6D11] rounded-xl flex items-center justify-center">
        <Box className="w-4.5 h-4.5 text-white" strokeWidth={1.75} />
      </div>
      <p className="text-5xl font-bold text-[#C0DD97] leading-none">404</p>
      <div className="space-y-1.5">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      </div>
      {backHref ? (
        <Link href={backHref} className="text-sm text-[#3B6D11] hover:underline">
          ← {backLabel}
        </Link>
      ) : (
        <button
          onClick={() => router.back()}
          className="text-sm text-[#3B6D11] hover:underline"
        >
          ← {backLabel}
        </button>
      )}
    </div>
  )
}
