export default function WissenLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <span className="text-2xl font-bold tracking-wide text-[#161d57]">W I S S E N</span>
    </div>
  );
}