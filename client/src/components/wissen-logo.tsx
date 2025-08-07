export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <span className="text-2xl font-bold text-blue-600 tracking-wide">WISSEN</span>
    </div>
  );
}