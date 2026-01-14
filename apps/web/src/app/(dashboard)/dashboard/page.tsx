export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          CHISAN Platform에 오신 것을 환영합니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="재고 현황"
          value="-"
          description="총 재고 품목 수"
        />
        <DashboardCard
          title="진행 중인 발주"
          value="-"
          description="미완료 수입 발주"
        />
        <DashboardCard
          title="생산 작업"
          value="-"
          description="오늘 예정된 작업"
        />
        <DashboardCard
          title="알림"
          value="-"
          description="확인이 필요한 항목"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">시작하기</h2>
        <p className="mt-2 text-sm text-gray-600">
          Foundation 모듈 구현이 완료되면 여기에 핵심 기능들이 표시됩니다. 현재
          사용자 관리, 감사 로그, 시스템 설정 기능을 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
}

function DashboardCard({ title, value, description }: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}
