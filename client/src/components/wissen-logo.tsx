export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-1`}>
      <span className="text-2xl font-bold text-gray-800 tracking-wide">WISSEN</span>
      <div className="flex items-center">
        <div className="w-6 h-6 bg-blue-600 flex items-center justify-center transform rotate-45">
          <div className="text-white font-bold text-sm transform -rotate-45">W</div>
        </div>
      </div>
    </div>
  );
}