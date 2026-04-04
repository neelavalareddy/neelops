import NavBar from "@/components/NavBar";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";

export default function DashboardPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <WorkerDashboard />
      </main>
    </>
  );
}
