/** Re-mounts on every navigation, giving each page a short fade-in transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
