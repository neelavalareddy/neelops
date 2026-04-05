import LoginPageClient from "@/app/login/LoginPageClient";

interface Props {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LoginPage({ searchParams }: Props) {
  const rawNext = searchParams?.next;
  const nextValue = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const nextPath = nextValue && nextValue.startsWith("/") ? nextValue : "/dashboard";

  return <LoginPageClient nextPath={nextPath} />;
}
