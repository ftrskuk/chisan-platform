"use client";

import { useState, useCallback } from "react";

interface EntityWithId {
  id: string;
}

export interface CRUDState<T extends EntityWithId> {
  formOpen: boolean;
  editing: T | null;
  deleteTarget: T | null;
}

export interface CRUDActions<T extends EntityWithId> {
  openCreate: () => void;
  openEdit: (entity: T) => void;
  closeForm: () => void;
  openDelete: (entity: T) => void;
  closeDelete: () => void;
  handleFormOpenChange: (open: boolean) => void;
  handleDeleteOpenChange: (open: boolean) => void;
}

export function useCRUDState<T extends EntityWithId>(): CRUDState<T> &
  CRUDActions<T> {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((entity: T) => {
    setEditing(entity);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const openDelete = useCallback((entity: T) => {
    setDeleteTarget(entity);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditing(null);
    }
  }, []);

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  }, []);

  return {
    formOpen,
    editing,
    deleteTarget,
    openCreate,
    openEdit,
    closeForm,
    openDelete,
    closeDelete,
    handleFormOpenChange,
    handleDeleteOpenChange,
  };
}
