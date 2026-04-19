import DocumentGenerator from "@/components/DocumentGenerator";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <DocumentGenerator />
      <footer className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-gray-500">
        Dynamix DocGen · Meeting transcripts → BRD / SOW / Scope / Contract / SRS / Solution /
        Architecture · <span className="text-dynamix font-medium">Dynamix Solutions</span>
      </footer>
    </main>
  );
}
