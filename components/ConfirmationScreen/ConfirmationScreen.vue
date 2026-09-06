<script setup lang="ts">
import { computed } from 'vue'
import type { BookingFormData } from '~/types/booking'

const props = defineProps<{
  booking: BookingFormData
}>()

const emit = defineEmits<{
  reset: []
}>()

const formattedDate = computed(() => {
  const [year, month, day] = props.booking.date.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) return props.booking.date

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
})

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11 || (!digits.startsWith('7') && !digits.startsWith('8'))) {
    return value
  }

  const number = digits.slice(1)

  return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 8)}-${number.slice(8)}`
}

const formattedPhone = computed(() => formatPhone(props.booking.phone))

const guestsLabel = computed(() => {
  const value = props.booking.guests
  const mod100 = value % 100
  const mod10 = value % 10

  if (mod100 >= 11 && mod100 <= 14) return `${value} гостей`
  if (mod10 === 1) return `${value} гость`
  if (mod10 >= 2 && mod10 <= 4) return `${value} гостя`
  return `${value} гостей`
})
</script>

<template>
  <section :class="$style.card" aria-labelledby="confirmation-title">
    <div :class="$style.icon" aria-hidden="true">
      <span :class="$style.iconHalo" />
      <svg viewBox="0 0 24 24" fill="none">
        <path
          :class="$style.checkPath"
          d="m6.5 12.5 3.5 3.5 7.5-8"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <p :class="$style.eyebrow"><span aria-hidden="true" /> Бронирование подтверждено</p>
    <h1 id="confirmation-title" :class="$style.title">Столик ждёт вас</h1>
    <p :class="$style.lead">
      {{ booking.name }}, всё готово. Мы сохранили столик на выбранные дату и время.
    </p>

    <div :class="$style.summaryHeader">
      <span>Детали бронирования</span>
      <span :class="$style.status"><i aria-hidden="true" /> Подтверждено</span>
    </div>
    <dl :class="$style.summary">
      <div :class="$style.summaryRow">
        <dt>Имя</dt>
        <dd>{{ booking.name }}</dd>
      </div>
      <div :class="$style.summaryRow">
        <dt>Телефон</dt>
        <dd>{{ formattedPhone }}</dd>
      </div>
      <div :class="$style.summaryRow">
        <dt>Дата</dt>
        <dd>{{ formattedDate }}</dd>
      </div>
      <div :class="$style.summaryRow">
        <dt>Время</dt>
        <dd>{{ booking.time }}</dd>
      </div>
      <div :class="$style.summaryRow">
        <dt>Гости</dt>
        <dd>{{ guestsLabel }}</dd>
      </div>
    </dl>

    <button :class="$style.button" type="button" @click="emit('reset')">Забронировать ещё</button>
  </section>
</template>

<style module lang="scss" src="./ConfirmationScreen.module.scss"></style>
