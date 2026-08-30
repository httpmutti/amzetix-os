import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getFinancialKPIs,
  getClientKPIs,
  getTaskKPIs,
  getTimeTrackingKPIs,
  getTeamKPIs,
  getRecentInvoices,
  getRecentTasks,
  getMonthlyRevenueChart,
  getRecentActivity,
  getCompanyInfo,
  getDateRange,
} from "@/services/dashboard.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = getDateRange("this_month");

  const [
    financial,
    clients,
    tasks,
    timeTracking,
    team,
    recentInvoices,
    recentTasks,
    chart,
    activity,
    company,
  ] = await Promise.all([
    getFinancialKPIs(range),
    getClientKPIs(range),
    getTaskKPIs(),
    getTimeTrackingKPIs(),
    getTeamKPIs(),
    getRecentInvoices(5),
    getRecentTasks(5),
    getMonthlyRevenueChart(12),
    getRecentActivity(10),
    getCompanyInfo(),
  ]);

  return NextResponse.json({
    data: {
      financial,
      clients,
      tasks,
      timeTracking,
      team,
      recentInvoices,
      recentTasks,
      chart,
      activity,
      company,
    },
  });
}
