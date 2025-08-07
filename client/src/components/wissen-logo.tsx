export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <span className="text-2xl font-bold tracking-wide text-[#09103d]">WISSEN</span>
    </div>
  );
}