import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { EditEventComponent } from '../features/edit-event/edit-event.component';
import { AppDialogService } from '../services/app-dialog.service';

/** Blocks leaving the edit-event page when there are unsaved changes. */
export const editEventUnsavedGuard: CanDeactivateFn<EditEventComponent> = (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  return inject(AppDialogService).confirm({
    title: 'Leave without saving?',
    message: 'You have unsaved changes. If you leave this page, those changes will be lost.',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
    tone: 'danger'
  }).then((ok) => {
    if (ok) component.markLeaveAllowed();
    return ok;
  });
};
