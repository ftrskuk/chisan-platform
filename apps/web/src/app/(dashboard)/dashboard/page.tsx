import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/metric-card";
import { Package, FileInput, Factory, Bell } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="대시보드"
        description="CHISAN Platform에 오신 것을 환영합니다."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="재고 현황"
          value="-"
          icon={<Package />}
          trend={{ value: "총 재고 품목 수", direction: "neutral" }}
        />
        <MetricCard
          label="진행 중인 발주"
          value="-"
          icon={<FileInput />}
          trend={{ value: "미완료 수입 발주", direction: "neutral" }}
        />
        <MetricCard
          label="생산 작업"
          value="-"
          icon={<Factory />}
          trend={{ value: "오늘 예정된 작업", direction: "neutral" }}
        />
        <MetricCard
          label="알림"
          value="-"
          icon={<Bell />}
          trend={{ value: "확인이 필요한 항목", direction: "neutral" }}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">시작하기</h2>
        <p className="mt-2 text-sm text-slate-500">
          Foundation 모듈 구현이 완료되면 여기에 핵심 기능들이 표시됩니다. 현재
          사용자 관리, 감사 로그, 시스템 설정 기능을 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
