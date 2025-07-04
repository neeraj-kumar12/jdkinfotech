'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const res = await fetch("/api/auth/current-user");
      const result = await res.json();

      if (!result.success || !result.data) {
        router.replace("/login");
        return;
      }

      if (result.data.role === "student") {
        router.replace("/student-dashboard");
        return;
      }

      if (result.data.role === "staff") {
        router.replace("/staff-dashboard");
        return;
      }

      // fallback for unknown roles
      router.replace("/unauthorized");
    }

    checkUser();
  }, [router]);

  // Optionally, show a loading state while redirecting
  return <div>Loading...</div>;
}
