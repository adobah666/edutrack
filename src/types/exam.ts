import { Prisma } from '@prisma/client';

export type Term = "FIRST" | "SECOND" | "THIRD" | "FINAL";

export type ExamWithRelations = Omit<Prisma.ExamGetPayload<{
  include: {
    subject: true;
    class: true;
  }
}>, "term"> & {
  term: Term;
};
