import { CanDeactivateFn } from '@angular/router';
import { EditEventComponent } from '../features/edit-event/edit-event.component';

/** Blocks leaving the edit-event page when there are unsaved changes. */
export const editEventUnsavedGuard: CanDeactivateFn<EditEventComponent> = (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  const ok = window.confirm('You have unsaved changes. Discard them and leave this page?');
  if (ok) component.markLeaveAllowed();
  return ok;
};
