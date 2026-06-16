import Swal from 'sweetalert2'

const SENTENCES = [
  'I understand this delete cannot be undone.',
  'I am sure I want to delete this record.',
  'I know this will permanently remove this data.',
  'I confirm that I want to delete this item.',
  'I take responsibility for deleting this item.',
]

export interface ConfirmDestructiveOptions {
  title: string
  text?: string
}

/**
 * Shows a high-friction confirmation dialog for destructive actions.
 * User must type the word "delete" and then re-type a random sentence.
 * Returns true if the user passes both checks; false otherwise.
 */
export async function confirmDestructiveAction(opts: ConfirmDestructiveOptions): Promise<boolean> {
  const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)]

  const result = await Swal.fire({
    title: opts.title,
    html: `
      ${opts.text ? `<p class="mb-2">${opts.text}</p>` : ''}
      <p class="mb-2 small text-muted">
        To continue, type <strong>delete</strong> and then re-type this sentence exactly:
      </p>
      <p class="mb-2"><em>${sentence}</em></p>
      <input id="swal-delete-word" class="swal2-input" placeholder='Type: delete' />
      <input id="swal-random-sentence" class="swal2-input" placeholder='Type the sentence above exactly' />
    `,
    icon: 'warning',
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: 'Confirm delete',
    confirmButtonColor: '#d33',
    preConfirm: () => {
      const deleteInput = document.getElementById('swal-delete-word') as HTMLInputElement | null
      const sentenceInput = document.getElementById('swal-random-sentence') as HTMLInputElement | null
      const word = deleteInput?.value.trim().toLowerCase() ?? ''
      const typedSentence = sentenceInput?.value.trim() ?? ''

      if (word !== 'delete' || typedSentence !== sentence) {
        Swal.showValidationMessage('Please type "delete" and the sentence exactly as shown.')
        return
      }
      return true
    },
  })

  return !!result.isConfirmed && !result.isDismissed
}

