import { redirect } from "next/navigation";

/** Registration is free now; course payment lives in My Courses. */
export default function CheckoutPage() {
  redirect("/member/course");
}
