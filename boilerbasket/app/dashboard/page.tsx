import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/utils/fee";
import { getDropoffLabel } from "@/lib/utils/dropoff";
import {
  formatRelativeTime,
  getDeliveryWindow,
  getOpportunityScore,
  getOrderAgeMinutes,
  getOrderWalkMinutes,
  getUrgency,
} from "@/lib/utils/orders";
import type { OrderRow } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile for greeting
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, stripe_onboarding_complete")
    .eq("id", user.id)
    .single() as { data: { full_name: string; stripe_onboarding_complete: boolean } | null; error: unknown };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Boilermaker";

  const [{ data: myRequests }, { data: myPickups }, { data: openOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10) as unknown as { data: OrderRow[] | null },
    supabase
      .from("orders")
      .select("*")
      .eq("picker_id", user.id)
      .not("status", "eq", "cancelled")
      .order("claimed_at", { ascending: false })
      .limit(10) as unknown as { data: OrderRow[] | null },
    supabase
      .from("orders")
      .select("*")
      .eq("status", "open")
      .eq("payment_status", "held")
      .neq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20) as unknown as { data: OrderRow[] | null },
  ]);

  const activeRequests = myRequests?.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ) ?? [];
  const pastRequests = myRequests?.filter(
    (o) => ["delivered", "cancelled"].includes(o.status)
  ) ?? [];
  const activePickups = myPickups?.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ) ?? [];
  const recommendedOrders = [...(openOrders ?? [])]
    .sort((a, b) => getOpportunityScore(b) - getOpportunityScore(a))
    .slice(0, 3);
  const fastOrders = (openOrders ?? []).filter((order) => getOrderWalkMinutes(order) <= 8);
  const avgOpenFee = openOrders?.length
    ? openOrders.reduce((sum, order) => sum + order.convenience_fee, 0) / openOrders.length
    : 0;
  const oldestOpenAge = openOrders?.length
    ? Math.max(...openOrders.map((order) => getOrderAgeMinutes(order.created_at)))
    : 0;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-gray-900 tracking-wide">
              HEY, {firstName.toUpperCase()}
            </h1>
            <p className="font-body text-gray-500 text-sm mt-1">
              {openOrders?.length
                ? `${openOrders.length} open order${openOrders.length !== 1 ? "s" : ""} waiting for a picker`
                : "No open orders right now"}
            </p>
          </div>
          <Link
            href="/orders/new"
            className="font-body shrink-0 rounded-xl bg-[#CFB991] text-black font-semibold px-6 py-3 hover:bg-[#EBD99F] transition-colors text-sm"
          >
            + Request Food
          </Link>
        </div>

        {/* Smart marketplace pulse */}
        <section className="grid gap-4 md:grid-cols-3">
          <InsightCard
            title="Fastest runs"
            value={`${fastOrders.length}`}
            body="Open orders with an estimated walk under 8 minutes."
          />
          <InsightCard
            title="Average fee"
            value={formatCents(avgOpenFee)}
            body="Current convenience fee across the live marketplace."
          />
          <InsightCard
            title="Longest wait"
            value={oldestOpenAge ? `${oldestOpenAge}m` : "0m"}
            body="How long the oldest open request has been sitting."
          />
        </section>

        {/* Stripe Connect banner */}
        {profile && !profile.stripe_onboarding_complete && (
          <div className="rounded-2xl border border-[#CFB991]/30 bg-[#CFB991]/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-body font-semibold text-gray-800 text-sm">Want to earn money picking up orders?</p>
              <p className="font-body text-gray-500 text-xs mt-0.5">Connect your bank account via Stripe to receive picker payouts.</p>
            </div>
            <a
              href="/api/stripe/connect-onboarding"
              className="font-body shrink-0 rounded-xl bg-[#8E6F3E] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#CFB991] hover:text-black transition-colors"
            >
              Set up payouts
            </a>
          </div>
        )}

        {/* Recommended orders */}
        {!!recommendedOrders.length && (
          <section className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-xs font-semibold tracking-[0.24em] text-[#8E6F3E] uppercase">
                  Smart Picks
                </p>
                <h2 className="font-display text-3xl text-gray-900 tracking-wide">
                  BEST ORDERS TO GRAB RIGHT NOW
                </h2>
              </div>
              <Link
                href="#open-orders"
                className="font-body shrink-0 text-sm font-semibold text-[#8E6F3E] hover:text-[#CFB991] transition-colors"
              >
                See all open orders
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {recommendedOrders.map((order, index) => {
                const deliveryWindow = getDeliveryWindow(order);
                const urgency = getUrgency(order);

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#faf7ef] p-5 hover:border-[#CFB991]/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#8E6F3E]">
                        #{index + 1} match
                      </span>
                      <span className={`badge ${urgency.tone}`}>
                        {urgency.label}
                      </span>
                    </div>
                    <p className="font-body mt-4 text-base font-semibold text-gray-900">
                      {order.dining_hall} → {getDropoffLabel(order.dropoff_building)}
                    </p>
                    <p className="font-body mt-1 text-sm text-gray-500 line-clamp-2">
                      {order.items}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <MiniStat label="Fee" value={formatCents(order.convenience_fee)} />
                      <MiniStat label="Walk" value={`${deliveryWindow.walkMinutes} min`} />
                      <MiniStat label="ETA" value={`${deliveryWindow.low}-${deliveryWindow.high} min`} />
                      <MiniStat label="Posted" value={formatRelativeTime(order.created_at)} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Active requests */}
        {activeRequests.length > 0 && (
          <section>
            <SectionHeader title="Active Requests" count={activeRequests.length} />
            <OrderList orders={activeRequests} viewAs="requester" />
          </section>
        )}

        {/* Active pickups */}
        {activePickups.length > 0 && (
          <section>
            <SectionHeader title="My Active Pickups" count={activePickups.length} />
            <OrderList orders={activePickups} viewAs="picker" />
          </section>
        )}

        {/* Open orders feed */}
        <section id="open-orders">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Pick Up an Order" count={openOrders?.length ?? 0} />
          </div>
          {!openOrders?.length ? (
            <EmptyState
              icon="🍽️"
              title="No open orders right now"
              body="Check back soon — new orders get posted throughout the day."
            />
          ) : (
            <OrderList orders={openOrders} viewAs="picker" />
          )}
        </section>

        {/* Past requests */}
        {pastRequests.length > 0 && (
          <section>
            <SectionHeader title="Past Orders" />
            <OrderList orders={pastRequests} viewAs="requester" dim />
          </section>
        )}

      </main>
    </>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="font-body text-lg font-bold text-gray-900">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="font-body text-xs font-semibold bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </div>
  );
}

function OrderList({
  orders,
  viewAs,
  dim = false,
}: {
  orders: OrderRow[];
  viewAs: "requester" | "picker";
  dim?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderListItem order={order} viewAs={viewAs} dim={dim} />
        </li>
      ))}
    </ul>
  );
}

function OrderListItem({
  order,
  viewAs,
  dim,
}: {
  order: OrderRow;
  viewAs: "requester" | "picker";
  dim: boolean;
}) {
  const urgency = getUrgency(order);
  const walkMinutes = Math.round(getOrderWalkMinutes(order));
  const deliveryWindow = getDeliveryWindow(order);

  return (
    <Link
      href={`/orders/${order.id}`}
      className={`card flex flex-col gap-4 hover:border-[#CFB991]/40 hover:shadow-md transition-all ${dim ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-body font-semibold text-gray-900 truncate text-sm">
              {order.dining_hall} → {getDropoffLabel(order.dropoff_building)}
            </p>
            {viewAs === "picker" && order.status === "open" && (
              <span className={`badge ${urgency.tone}`}>{urgency.label}</span>
            )}
          </div>
          <p className="font-body text-xs text-gray-400 truncate">{order.items}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-body text-sm font-semibold text-gray-700">
            {formatCents(order.total_charge)}
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Walk" value={`${walkMinutes} min`} />
        <MiniStat label="Fee" value={formatCents(order.convenience_fee)} />
        <MiniStat label="ETA" value={`${deliveryWindow.low}-${deliveryWindow.high} min`} />
        <MiniStat
          label={order.status === "open" ? "Posted" : "Updated"}
          value={formatRelativeTime(order.updated_at ?? order.created_at)}
        />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-body font-semibold text-gray-700 mb-1">{title}</p>
      <p className="font-body text-sm text-gray-400">{body}</p>
    </div>
  );
}

function InsightCard({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <div className="card bg-gradient-to-br from-white to-[#faf7ef]">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        {title}
      </p>
      <p className="font-display mt-3 text-4xl tracking-wide text-gray-900">{value}</p>
      <p className="font-body mt-2 text-sm text-gray-500">{body}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className="font-body mt-1 text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
