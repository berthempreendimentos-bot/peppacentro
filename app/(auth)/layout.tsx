export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,var(--secondary)_60%,var(--background)_100%)] md:h-56">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="-mt-16 flex flex-1 justify-center px-4 pb-16 md:-mt-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
