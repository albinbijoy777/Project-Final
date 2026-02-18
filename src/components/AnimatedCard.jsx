export default function AnimatedCard({ children }) {
  return (
    <div className="transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {children}
    </div>
  );
}
