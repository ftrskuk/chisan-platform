type AuditChanges = Record<string, { old: unknown; new: unknown }>;

export function buildAuditChanges(
  oldRecord: Record<string, unknown>,
  newValues: Record<string, unknown>,
  fieldMapping: Record<string, string>,
): AuditChanges {
  const changes: AuditChanges = {};

  for (const [inputKey, dbKey] of Object.entries(fieldMapping)) {
    if (inputKey in newValues) {
      const oldValue = oldRecord[dbKey];
      const newValue = newValues[inputKey];

      if (newValue !== undefined && oldValue !== newValue) {
        changes[inputKey] = { old: oldValue, new: newValue };
      }
    }
  }

  return changes;
}
