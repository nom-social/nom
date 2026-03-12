import LoginForm from "./page/login-form";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center h-[80vh] px-2">
      <div className="max-w-2xl w-full">
        <LoginForm />
      </div>
    </main>
  );
}
