import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import EventsTable from "@/components/client/EventsTable";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type EventList = Event & { class: Class | null };

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page: pageStr, ...restParams } = searchParams;
  const p = pageStr ? parseInt(pageStr) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.EventWhereInput = {};

  if (restParams) {
    for (const [key, value] of Object.entries(restParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS - Only apply for non-admin roles
  if (role !== "admin") {
    const roleConditions = {
      teacher: { lessons: { some: { teacherId: currentUserId! } } },
      student: { students: { some: { id: currentUserId! } } },
      parent: { students: { some: { parentId: currentUserId! } } },
    };

    query.OR = [
      { classId: null },
      {
        class: roleConditions[role as keyof typeof roleConditions] || {},
      },
    ];
  }

  // Fetch the data
  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: {
        class: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        startTime: 'desc'
      }
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="event" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <EventsTable data={data} role={role} />
      {/* PAGINATION */}
      <Pagination count={count} page={p} />
    </div>
  );
};

export default EventListPage;
