alter table public.course_module_quiz_questions
  add column if not exists explanation text;

alter table public.course_module_quiz_questions
  drop constraint if exists course_module_quiz_questions_explanation_len;

alter table public.course_module_quiz_questions
  add constraint course_module_quiz_questions_explanation_len
  check (explanation is null or char_length(explanation) <= 1000);
