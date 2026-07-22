export function authInputCls(hasError) {
  return `w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/50 focus:border-[#5B5FEF]/50 hover:border-white/20 ${
    hasError ? 'border-red-400/50 bg-red-500/[0.06]' : 'border-white/10'
  }`
}

export function authInputIconCls(hasError) {
  return `w-full rounded-xl border bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/50 focus:border-[#5B5FEF]/50 hover:border-white/20 ${
    hasError ? 'border-red-400/50 bg-red-500/[0.06]' : 'border-white/10'
  }`
}
