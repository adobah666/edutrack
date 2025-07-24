import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import PayrollTable from "@/components/PayrollTable";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getSchoolFilter } from "@/lib/school-context";
import { Prisma } from "@prisma/client";
import Image from "next/image";

type PayrollList = {
    id: number;
    teacher: {
        id: string;
        name: string;
        surname: string;
        email: string | null;
    };
    baseSalary: number;
    currency: string;
    payFrequency: string;
    isActive: boolean;
    nextPayment?: {
        amount: number;
        dueDate: Date;
        status: string;
    } | null;
};

const columns = [
    {
        header: "Staff Info",
        accessor: "info",
    },
    {
        header: "Base Salary",
        accessor: "baseSalary",
        className: "hidden md:table-cell",
    },
    {
        header: "Pay Frequency",
        accessor: "payFrequency",
        className: "hidden md:table-cell",
    },
    {
        header: "Next Payment",
        accessor: "nextPayment",
        className: "hidden lg:table-cell",
    },
    {
        header: "Status",
        accessor: "status",
        className: "hidden lg:table-cell",
    },
    {
        header: "Actions",
        accessor: "action",
    },
];



const PayrollListPage = async ({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) => {
    const schoolFilter = await getSchoolFilter();
    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // URL PARAMS CONDITION
    const query: Prisma.StaffSalaryWhereInput = {};

    // Add school filter if schoolId exists
    if (schoolFilter.schoolId) {
        query.schoolId = schoolFilter.schoolId;
    }

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.OR = [
                            { teacher: { name: { contains: value, mode: "insensitive" } } },
                            { teacher: { surname: { contains: value, mode: "insensitive" } } },
                            { teacher: { email: { contains: value, mode: "insensitive" } } },
                        ];
                        break;
                    case "status":
                        if (value === "active") {
                            query.isActive = true;
                        } else if (value === "inactive") {
                            query.isActive = false;
                        }
                        break;
                    case "frequency":
                        query.payFrequency = value.toUpperCase() as any;
                        break;
                }
            }
        }
    }

    // First, update any overdue payments across all staff
    const today = new Date();
    if (query.schoolId && typeof query.schoolId === 'string') {
        await prisma.salaryPayment.updateMany({
            where: {
                status: "PENDING",
                dueDate: {
                    lt: today,
                },
                schoolId: query.schoolId,
            },
            data: {
                status: "OVERDUE",
            },
        });
    }

    const [data, count] = await prisma.$transaction([
        prisma.staffSalary.findMany({
            where: query,
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true,
                    },
                },
                payments: {
                    where: {
                        OR: [
                            { status: "PENDING" },
                            { status: "OVERDUE" },
                        ],
                    },
                    orderBy: {
                        dueDate: "asc",
                    },
                    take: 1,
                },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
            orderBy: {
                teacher: {
                    name: "asc",
                },
            },
        }),
        prisma.staffSalary.count({ where: query }),
    ]);

    const payrollData: PayrollList[] = data.map((item) => ({
        id: item.id,
        teacher: item.teacher,
        baseSalary: item.baseSalary,
        currency: item.currency,
        payFrequency: item.payFrequency,
        isActive: item.isActive,
        nextPayment: item.payments[0] ? {
            amount: item.payments[0].amount,
            dueDate: item.payments[0].dueDate,
            status: item.payments[0].status,
        } : null,
    }));

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">Staff Payroll</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                            <Image src="/filter.png" alt="" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                            <Image src="/sort.png" alt="" width={14} height={14} />
                        </button>
                        <FormContainer table="staffSalary" type="create" />
                    </div>
                </div>
            </div>
            {/* LIST */}
            <PayrollTable data={payrollData} />
            {/* PAGINATION */}
            <Pagination page={p} count={count} />
        </div>
    );
};

export default PayrollListPage;