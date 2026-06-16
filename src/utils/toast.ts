import Swal from 'sweetalert2'

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
})

export function toastSuccess(message: string) {
  void toast.fire({ icon: 'success', title: message })
}

export function toastError(message: string) {
  void toast.fire({ icon: 'error', title: message })
}

