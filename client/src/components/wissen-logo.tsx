export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-2`}>
      <div className="bg-blue-600 text-white px-2 py-1 rounded font-bold text-sm">
        WISSEN
      </div>
      <div className="text-blue-600 font-bold text-sm">W</div>
    </div>
  );
}