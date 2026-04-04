import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import OrderForm from "@/components/orders/OrderForm";

export default async function NewOrderPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">Request a Pickup</h1>
        <OrderForm userId={user.id} />
      </main>
    </>
  );
}
