export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-2`}>
      <div className="text-blue-600 font-bold text-sm">W</div>
    </div>
  );
}