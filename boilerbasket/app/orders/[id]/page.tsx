import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import OrderDetail from "@/components/orders/OrderDetail";

interface Props {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: Props) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  // Determine viewer role
  const isRequester = order.requester_id === user.id;
  const isPicker = order.picker_id === user.id;

  // Non-participants can still view open orders (for claiming)
  // But once claimed, only requester + picker can see details
  if (order.status !== "open" && !isRequester && !isPicker) {
    redirect("/dashboard");
  }

  // Fetch existing reviews for this order made by this user
  const { data: myReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", order.id)
    .eq("reviewer_id", user.id);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <OrderDetail
          order={order}
          userId={user.id}
          isRequester={isRequester}
          isPicker={isPicker}
          myReviews={myReviews ?? []}
        />
      </main>
    </>
  );
}
