"use client";

import { toast } from "sonner";

import { useSettings, useUpdateSetting } from "@/hooks/api";
import { PageHeader } from "@/components/layout";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Setting, SettingCategory } from "@repo/shared";
import { useState, useEffect } from "react";

const CATEGORY_LABELS: Record<SettingCategory, string> = {
  company: "회사 정보",
  regional: "지역 설정",
  inventory: "재고 설정",
  notifications: "알림 설정",
};

const SETTING_LABELS: Record<string, string> = {
  name: "회사명",
  address: "주소",
  timezone: "시간대",
  locale: "언어",
  currency: "통화",
  default_warehouse: "기본 창고",
  fifo_enabled: "FIFO 적용",
  email_enabled: "이메일 알림",
  slack_webhook: "Slack Webhook URL",
};

const CATEGORIES: SettingCategory[] = [
  "company",
  "regional",
  "inventory",
  "notifications",
];

export default function SystemSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSetting();
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (settings) {
      const values: Record<string, unknown> = {};
      for (const setting of settings) {
        values[`${setting.category}.${setting.key}`] = setting.value;
      }
      setEditValues(values);
    }
  }, [settings]);

  const groupedSettings = (settings ?? []).reduce(
    (acc, setting) => {
      const category = setting.category as SettingCategory;
      if (!acc[category]) acc[category] = [];
      acc[category].push(setting);
      return acc;
    },
    {} as Record<SettingCategory, Setting[]>,
  );

  const handleSave = async (category: SettingCategory, key: string) => {
    const settingKey = `${category}.${key}`;
    const value = editValues[settingKey];

    try {
      await updateMutation.mutateAsync({ category, key, value });
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
      );
    }
  };

  const hasChanges = (setting: Setting) => {
    const settingKey = `${setting.category}.${setting.key}`;
    return (
      JSON.stringify(editValues[settingKey]) !== JSON.stringify(setting.value)
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="시스템 설정"
          description="시스템 전체에 적용되는 설정을 관리합니다."
        />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 설정"
        description="시스템 전체에 적용되는 설정을 관리합니다."
      />

      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          const categorySettings = groupedSettings[category] ?? [];
          if (categorySettings.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-1 rounded-md border border-gray-100 bg-white">
                {categorySettings.map((setting, index) => {
                  const settingKey = `${setting.category}.${setting.key}`;
                  const currentValue = editValues[settingKey];
                  const isBoolean = typeof setting.value === "boolean";
                  const showSave = hasChanges(setting);
                  const isSaving = updateMutation.isPending;

                  return (
                    <div
                      key={setting.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${
                        index !== categorySettings.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <label className="text-sm font-medium text-foreground">
                          {SETTING_LABELS[setting.key] ?? setting.key}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isBoolean ? (
                          <Switch
                            checked={currentValue === true}
                            onCheckedChange={(checked) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [settingKey]: checked,
                              }))
                            }
                          />
                        ) : (
                          <Input
                            type="text"
                            value={
                              currentValue === null
                                ? ""
                                : String(currentValue ?? "")
                            }
                            placeholder={
                              currentValue === null
                                ? "설정되지 않음"
                                : undefined
                            }
                            onChange={(e) => {
                              const newValue = e.target.value;
                              let parsedValue: string | number | null =
                                newValue || null;
                              // Preserve number type if original value was a number
                              if (
                                typeof setting.value === "number" &&
                                newValue !== ""
                              ) {
                                const num = Number(newValue);
                                if (!Number.isNaN(num)) {
                                  parsedValue = num;
                                }
                              }
                              setEditValues((prev) => ({
                                ...prev,
                                [settingKey]: parsedValue,
                              }));
                            }}
                            className="w-64"
                          />
                        )}
                        {showSave && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSave(
                                setting.category as SettingCategory,
                                setting.key,
                              )
                            }
                            disabled={isSaving}
                          >
                            {isSaving ? "저장 중..." : "저장"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
