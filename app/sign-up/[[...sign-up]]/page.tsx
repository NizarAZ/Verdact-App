import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="app-dashboard flex min-h-screen items-center justify-center px-5 py-12">
      <SignUp />
    </main>
  );
}
