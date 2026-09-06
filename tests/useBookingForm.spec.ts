import { describe, expect, it, vi } from 'vitest'
import {
  getBookingDateRange,
  normalizePhone,
  TIME_SLOTS,
  useBookingForm,
  validateDate,
  validateGuests,
  validateName,
  validatePhone,
  validateTime,
} from '../composables/useBookingForm'

const NOW = new Date(2026, 8, 6, 18, 30)

describe('booking validation', () => {
  it('accepts a valid Unicode name with spaces and a hyphen', () => {
    expect(validateName('Анна-Мария')).toBeNull()
    expect(validateName(' Жан Поль ')).toBeNull()
  })

  it('rejects an empty, too short, or invalid name', () => {
    expect(validateName('   ')).toBe('Укажите имя.')
    expect(validateName('А')).toBe('Имя должно содержать минимум 2 символа.')
    expect(validateName('Анна2')).toBe('Используйте только буквы, пробелы и дефис.')
  })

  it('normalizes and validates supported Russian phone formats', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('+79991234567')
    expect(validatePhone('+7 (999) 123-45-67')).toBeNull()
    expect(validatePhone('8 999 123 45 67')).toBeNull()
  })

  it('rejects phone numbers with the wrong prefix, length, or characters', () => {
    expect(validatePhone('')).toBe('Укажите номер телефона.')
    expect(validatePhone('+1 (999) 123-45-67')).not.toBeNull()
    expect(validatePhone('+7 999 123-45')).not.toBeNull()
    expect(validatePhone('+7 test 999 123-45-67')).not.toBeNull()
    expect(validatePhone('79991234567')).not.toBeNull()
    expect(validatePhone('+89991234567')).not.toBeNull()
    expect(validatePhone('++79991234567')).not.toBeNull()
  })

  it('rejects a name made only of hyphens and spaces', () => {
    expect(validateName('--')).not.toBeNull()
  })

  it('allows dates from today through the inclusive 90-day boundary', () => {
    expect(getBookingDateRange(NOW)).toEqual({ min: '2026-09-06', max: '2026-12-05' })
    expect(validateDate('2026-09-06', NOW)).toBeNull()
    expect(validateDate('2026-12-05', NOW)).toBeNull()
  })

  it('rejects dates outside the range and impossible calendar dates', () => {
    expect(validateDate('2026-09-05', NOW)).toBe('Дата не может быть раньше сегодняшнего дня.')
    expect(validateDate('2026-12-06', NOW)).toBe('Дата должна быть не позднее чем через 90 дней.')
    expect(validateDate('2026-02-30', NOW)).toBe('Введите корректную дату.')
  })

  it('accepts only the specified time slots', () => {
    expect(TIME_SLOTS).toHaveLength(11)
    expect(validateTime('12:00')).toBeNull()
    expect(validateTime('22:00')).toBeNull()
    expect(validateTime('12:30')).not.toBeNull()
    expect(validateTime('23:00')).not.toBeNull()
  })

  it('accepts only integer guest counts from 1 through 12', () => {
    expect(validateGuests(1)).toBeNull()
    expect(validateGuests(12)).toBeNull()
    expect(validateGuests(0)).not.toBeNull()
    expect(validateGuests(13)).not.toBeNull()
    expect(validateGuests(2.5)).not.toBeNull()
    expect(validateGuests(Number.NaN)).not.toBeNull()
  })
})

describe('useBookingForm', () => {
  it('shows a field error after field validation and clears it after correction', () => {
    const { errors, form, touched, validateField } = useBookingForm({ now: () => NOW })

    expect(validateField('name')).toBe(false)
    expect(touched.name).toBe(true)
    expect(errors.name).toBe('Укажите имя.')

    form.name = 'Анна'
    expect(validateField('name')).toBe(true)
    expect(errors.name).toBeUndefined()
  })

  it('does not submit an invalid form and exposes every field error', async () => {
    const { errors, status, submit } = useBookingForm({ now: () => NOW, submitDelayMs: 0 })

    await expect(submit()).resolves.toBeNull()
    expect(status.value).toBe('idle')
    expect(Object.keys(errors)).toEqual(['name', 'phone', 'date', 'time'])
  })

  it('moves through loading to success after 1500 ms and returns a snapshot', async () => {
    vi.useFakeTimers()
    const { form, isLoading, status, submit } = useBookingForm({ now: () => NOW })
    Object.assign(form, {
      name: 'Анна',
      phone: '+7 (999) 123-45-67',
      date: '2026-09-06',
      time: '19:00',
      guests: 3,
    })

    const submission = submit()
    expect(status.value).toBe('loading')
    expect(isLoading.value).toBe(true)

    await vi.advanceTimersByTimeAsync(1499)
    expect(status.value).toBe('loading')

    await vi.advanceTimersByTimeAsync(1)
    await expect(submission).resolves.toEqual({ ...form })
    expect(status.value).toBe('success')
    expect(isLoading.value).toBe(false)
    vi.useRealTimers()
  })

  it('resets form state, touched fields, and errors', () => {
    const { errors, form, reset, status, touched, validateField } = useBookingForm({
      now: () => NOW,
    })
    form.name = 'А'
    validateField('name')
    status.value = 'success'

    reset()

    expect(form).toEqual({ name: '', phone: '', date: '', time: '', guests: 1 })
    expect(errors).toEqual({})
    expect(Object.values(touched).every((value) => value === false)).toBe(true)
    expect(status.value).toBe('idle')
  })
})
