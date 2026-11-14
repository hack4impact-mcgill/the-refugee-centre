import LoginForm from "@/app/login/login-form";

type LoginPageProps = {
  searchParams: Promise<{ authError?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { authError } = await searchParams;

  return <LoginForm hasAuthError={authError === "1"} />;
}
