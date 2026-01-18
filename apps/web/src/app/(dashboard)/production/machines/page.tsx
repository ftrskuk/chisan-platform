"use client";

import { useMachines, useUpdateMachineStatus } from "@/hooks/api";
import { PageHeader } from "@/components/layout";
import { MachineStatusBadge } from "@/components/slitting/machine-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { machineStatusLabels } from "@/lib/constants/slitting-labels";
import type { MachineStatus, Machine } from "@repo/shared";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";

export default function MachinesPage() {
  const { data: machinesResponse, isLoading } = useMachines();
  const { mutate: updateStatus } = useUpdateMachineStatus();

  const handleStatusChange = (id: string, newStatus: MachineStatus) => {
    updateStatus(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success("기계 상태가 변경되었습니다.");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "상태 변경에 실패했습니다.",
          );
          console.error(error);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="기계 현황"
        description="슬리팅 기계의 실시간 상태를 모니터링하고 관리합니다."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {machinesResponse?.data.map((machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            onStatusChange={handleStatusChange}
          />
        ))}
        {isLoading && (
          <div className="col-span-full py-10 text-center text-muted-foreground">
            로딩중...
          </div>
        )}
        {!isLoading && machinesResponse?.data?.length === 0 && (
          <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Settings2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-foreground">
              등록된 기계가 없습니다
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              새로운 기계를 추가하여 생산 관리를 시작하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MachineCardProps {
  machine: Machine;
  onStatusChange: (id: string, status: MachineStatus) => void;
}

function MachineCard({ machine, onStatusChange }: MachineCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{machine.name}</CardTitle>
          <CardDescription>
            {machine.description || "설명 없음"}
          </CardDescription>
        </div>
        <Settings2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            현재 상태
          </span>
          <MachineStatusBadge status={machine.status} />
        </div>
      </CardContent>
      <CardFooter>
        <Select
          value={machine.status}
          onValueChange={(value) =>
            onStatusChange(machine.id, value as MachineStatus)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="상태 변경" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idle">{machineStatusLabels.idle}</SelectItem>
            <SelectItem value="running">
              {machineStatusLabels.running}
            </SelectItem>
            <SelectItem value="maintenance">
              {machineStatusLabels.maintenance}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
}
