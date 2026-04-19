export default function Header() {
  return (
    <header className="border-b border-dynamix/20 bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Dynamix Solutions" className="h-10 w-auto" />
          <div>
            <div className="text-dynamix font-bold text-lg leading-none">
              Dynamix DocGen
            </div>
            <div className="text-[11px] text-gray-500 leading-tight">
              Meeting transcript → Professional project documents
            </div>
          </div>
        </div>
        <nav className="text-sm text-gray-600 hidden md:flex items-center gap-5">
          <span className="italic text-dynamix">
            Innovate, Optimize, Succeed with Dynamix Solutions
          </span>
        </nav>
      </div>
    </header>
  );
}
