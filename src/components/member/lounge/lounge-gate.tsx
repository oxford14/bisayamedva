import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MemberEmptyState } from "@/components/member/ui";

export function LoungeGate() {
  return (
    <MemberEmptyState
      title="Student Lounge is for enrolled students"
      body="Enroll sa usa ka session una para maka-join sa Lounge — ask questions, share wins, and connect with co-students."
      action={
        <Button variant="accent" asChild>
          <Link href="/member/course">Browse courses</Link>
        </Button>
      }
    />
  );
}
