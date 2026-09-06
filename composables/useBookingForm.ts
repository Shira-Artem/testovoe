import { computed, reactive, ref } from 'vue'
import type {
  BookingErrors,
  BookingField,
  BookingFormData,
  BookingStatus,
  TouchedFields,
} from '~/types/booking'

export const TIME_SLOTS = [
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
] as const

const BOOKING_FIELDS: readonly BookingField[] = ['name', 'phone', 'date', 'time', 'guests']
interface UseBookingFormOptions {
  now?: () => Date
  submitDelayMs?: number
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return null

  const [, yearValue, monthValue, dayValue] = match
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export function getBookingDateRange(now = new Date()): { min: string; max: string } {
  const minDate = startOfLocalDay(now)
  const maxDate = new Date(minDate)
  maxDate.setDate(maxDate.getDate() + 90)

  return {
    min: toLocalDateInputValue(minDate),
    max: toLocalDateInputValue(maxDate),
  }
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/[()\s-]/g, '')
}

export function validateName(value: string): string | null {
  const name = value.trim()

  if (!name) return 'Укажите имя.'
  if (name.length < 2) return 'Имя должно содержать минимум 2 символа.'
  if (!/\p{L}/u.test(name)) return 'Имя должно содержать хотя бы одну букву.'
  if (!/^[\p{L} -]+$/u.test(name)) return 'Используйте только буквы, пробелы и дефис.'

  return null
}

export function validatePhone(value: string): string | null {
  const phone = value.trim()

  if (!phone) return 'Укажите номер телефона.'
  if (!/^[\d+()\s-]+$/.test(phone)) {
    return 'Введите корректный номер: +7 или 8 и 10 цифр.'
  }

  const normalized = normalizePhone(phone)
  const isRussianNumber = /^(?:\+7\d{10}|8\d{10})$/.test(normalized)

  return isRussianNumber ? null : 'Введите корректный номер: +7 или 8 и 10 цифр.'
}

export function validateDate(value: string, now = new Date()): string | null {
  if (!value) return 'Выберите дату.'

  const date = parseLocalDate(value)
  if (!date) return 'Введите корректную дату.'

  const today = startOfLocalDay(now)
  const maximumDate = new Date(today)
  maximumDate.setDate(maximumDate.getDate() + 90)

  if (date < today) return 'Дата не может быть раньше сегодняшнего дня.'
  if (date > maximumDate) return 'Дата должна быть не позднее чем через 90 дней.'

  return null
}

export function validateTime(value: string): string | null {
  if (!value) return 'Выберите время.'

  return TIME_SLOTS.some((slot) => slot === value)
    ? null
    : 'Выберите время с 12:00 до 22:00 с шагом 1 час.'
}

export function validateGuests(value: number): string | null {
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    return 'Укажите целое количество гостей от 1 до 12.'
  }

  return null
}

export function useBookingForm(options: UseBookingFormOptions = {}) {
  const now = options.now ?? (() => new Date())
  const submitDelayMs = options.submitDelayMs ?? 1500
  const status = ref<BookingStatus>('idle')
  const errors = reactive<BookingErrors>({})
  const touched = reactive<TouchedFields>({
    name: false,
    phone: false,
    date: false,
    time: false,
    guests: false,
  })
  const form = reactive<BookingFormData>({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: 1,
  })

  const dateRange = computed(() => getBookingDateRange(now()))
  const isLoading = computed(() => status.value === 'loading')

  function getFieldError(field: BookingField): string | null {
    switch (field) {
      case 'name':
        return validateName(form.name)
      case 'phone':
        return validatePhone(form.phone)
      case 'date':
        return validateDate(form.date, now())
      case 'time':
        return validateTime(form.time)
      case 'guests':
        return validateGuests(form.guests)
    }
  }

  function validateField(field: BookingField): boolean {
    touched[field] = true
    const error = getFieldError(field)

    if (error) errors[field] = error
    else Reflect.deleteProperty(errors, field)

    return error === null
  }

  function revalidateIfTouched(field: BookingField): void {
    if (touched[field]) validateField(field)
  }

  function validate(): boolean {
    return BOOKING_FIELDS.map(validateField).every(Boolean)
  }

  async function submit(): Promise<BookingFormData | null> {
    if (isLoading.value || !validate()) return null

    status.value = 'loading'
    await new Promise<void>((resolve) => setTimeout(resolve, submitDelayMs))
    status.value = 'success'

    return { ...form }
  }

  function reset(): void {
    form.name = ''
    form.phone = ''
    form.date = ''
    form.time = ''
    form.guests = 1
    status.value = 'idle'

    for (const field of BOOKING_FIELDS) {
      touched[field] = false
      Reflect.deleteProperty(errors, field)
    }
  }

  return {
    dateRange,
    errors,
    form,
    isLoading,
    reset,
    status,
    submit,
    touched,
    validate,
    validateField,
    revalidateIfTouched,
  }
}
