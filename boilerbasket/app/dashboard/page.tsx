import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/utils/fee";
import type { OrderRow } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch orders where user is requester
  const { data: myRequests } = await supabase
    .from("orders")
    .select("*")
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch orders where user is picker
  const { data: myPickups } = await supabase
    .from("orders")
    .select("*")
    .eq("picker_id", user.id)
    .order("claimed_at", { ascending: false })
    .limit(20);

  // Fetch open orders the user could pick up
  const { data: openOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "open")
    .neq("requester_id", user.id)   // can't pick up your own order
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/orders/new"
            className="rounded-xl bg-[#CFB991] text-black font-semibold px-5 py-2.5 hover:bg-[#EBD99F] transition-colors"
          >
            + Request Food
          </Link>
          <a
            href="#open-orders"
            className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold hover:bg-gray-50 transition-colors"
          >
            Pick Up an Order
          </a>
        </div>

        {/* My Requests */}
        <section>
          <h2 className="text-xl font-bold mb-4">My Requests</h2>
          {!myRequests?.length ? (
            <p className="text-gray-500 text-sm">
              No requests yet.{" "}
              <Link href="/orders/new" className="text-[#8E6F3E] hover:underline">
                Post your first order
              </Link>
              .
            </p>
          ) : (
            <OrderList orders={myRequests} viewAs="requester" />
          )}
        </section>

        {/* My Pickups */}
        {(myPickups?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">My Pickups</h2>
            <OrderList orders={myPickups!} viewAs="picker" />
          </section>
        )}

        {/* Open Orders Feed */}
        <section id="open-orders">
          <h2 className="text-xl font-bold mb-4">Open Orders — Pick Up</h2>
          {!openOrders?.length ? (
            <p className="text-gray-500 text-sm">No open orders right now. Check back soon.</p>
          ) : (
            <OrderList orders={openOrders} viewAs="picker" />
          )}
        </section>

      </main>
    </>
  );
}

function OrderList({
  orders,
  viewAs,
}: {
  orders: OrderRow[];
  viewAs: "requester" | "picker";
}) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="card flex items-center justify-between gap-4 hover:border-[#CFB991] transition-colors"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{order.dining_hall} → {order.dropoff_building}</p>
              <p className="text-sm text-gray-500 truncate mt-0.5">{order.items}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-gray-700">
                {formatCents(order.total_charge)}
              </span>
              <StatusBadge status={order.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
