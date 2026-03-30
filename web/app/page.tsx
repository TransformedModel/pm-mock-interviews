import { InterviewPrepApp } from "@/components/InterviewPrepApp";
import { getQuestionBank } from "@/lib/questionBank.server";
import type { CategoryKey } from "@/lib/types";

export default async function Home() {
  const bank = await getQuestionBank();
  const initialCategory: CategoryKey = "product_design";
  const list = bank[initialCategory];
  const initialQuestion = list[0];
  return (
    <InterviewPrepApp
      bank={bank}
      initialCategory={initialCategory}
      initialQuestion={initialQuestion}
    />
  );
}
