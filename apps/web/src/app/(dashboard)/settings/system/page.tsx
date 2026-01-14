"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Setting, SettingCategory } from "@repo/shared";

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

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Setting[]>("/api/v1/settings");
      setSettings(data);

      const values: Record<string, unknown> = {};
      for (const setting of data) {
        values[`${setting.category}.${setting.key}`] = setting.value;
      }
      setEditValues(values);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (category: SettingCategory, key: string) => {
    const settingKey = `${category}.${key}`;
    const value = editValues[settingKey];

    try {
      setSaving(settingKey);
      await api.patch(`/api/v1/settings/${category}/${key}`, { value });
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setSaving(null);
    }
  };

  const groupedSettings = settings.reduce(
    (acc, setting) => {
      const category = setting.category as SettingCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    },
    {} as Record<SettingCategory, Setting[]>,
  );

  const categories: SettingCategory[] = [
    "company",
    "regional",
    "inventory",
    "notifications",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          시스템 전체에 적용되는 설정을 관리합니다.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((category) => {
          const categorySettings = groupedSettings[category] ?? [];
          if (categorySettings.length === 0) return null;

          return (
            <div
              key={category}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {CATEGORY_LABELS[category]}
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {categorySettings.map((setting) => {
                  const settingKey = `${setting.category}.${setting.key}`;
                  const currentValue = editValues[settingKey];
                  const originalValue = setting.value;
                  const hasChanges =
                    JSON.stringify(currentValue) !==
                    JSON.stringify(originalValue);
                  const isSaving = saving === settingKey;

                  return (
                    <div key={setting.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <label className="block text-sm font-medium text-gray-900">
                            {SETTING_LABELS[setting.key] ?? setting.key}
                          </label>
                          {setting.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <SettingInput
                            settingKey={setting.key}
                            value={currentValue}
                            onChange={(value) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [settingKey]: value,
                              }))
                            }
                          />
                          {hasChanges && (
                            <button
                              onClick={() =>
                                handleSave(
                                  setting.category as SettingCategory,
                                  setting.key,
                                )
                              }
                              disabled={isSaving}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isSaving ? "저장 중..." : "저장"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SettingInputProps {
  settingKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

function SettingInput({ settingKey, value, onChange }: SettingInputProps) {
  if (settingKey === "fifo_enabled" || settingKey === "email_enabled") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          value ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  if (value === null) {
    return (
      <input
        type="text"
        value=""
        placeholder="설정되지 않음"
        onChange={(e) => onChange(e.target.value || null)}
        className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      />
    );
  }

  if (typeof value === "string") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      />
    );
  }

  return (
    <input
      type="text"
      value={JSON.stringify(value)}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch {
          onChange(e.target.value);
        }
      }}
      className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
    />
  );
}
