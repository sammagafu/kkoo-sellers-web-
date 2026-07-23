import Swal from 'sweetalert2'

export interface ConfirmDestructiveOptions {
  title: string
  text?: string
  /** Confirm button label (default: Delete) */
  confirmText?: string
}

/**
 * Simple delete/deactivate confirmation used across admin & seller screens.
 * One click Cancel / Delete — no typing required.
 */
export async function confirmDestructiveAction(opts: ConfirmDestructiveOptions): Promise<boolean> {
  const result = await Swal.fire({
    title: opts.title,
    text: opts.text || undefined,
    icon: 'warning',
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: opts.confirmText || 'Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    reverseButtons: true,
  })

  return !!result.isConfirmed
}
