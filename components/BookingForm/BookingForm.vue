<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { TIME_SLOTS, useBookingForm } from '~/composables/useBookingForm'
import type { BookingField, BookingFormData } from '~/types/booking'

const emit = defineEmits<{
  confirmed: [booking: BookingFormData]
}>()

const formElement = ref<HTMLFormElement | null>(null)

const { dateRange, errors, form, isLoading, revalidateIfTouched, submit, validateField } =
  useBookingForm()

function changeGuests(delta: number): void {
  const nextValue = Math.min(12, Math.max(1, form.guests + delta))

  if (nextValue === form.guests) return

  form.guests = nextValue
  revalidateIfTouched('guests')
}

function errorId(field: BookingField): string | undefined {
  return errors[field] ? `${field}-error` : undefined
}

async function handleSubmit(): Promise<void> {
  const booking = await submit()

  if (booking) {
    emit('confirmed', booking)
    return
  }

  await nextTick()
  formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>

<template>
  <section :class="$style.card" aria-labelledby="booking-title">
    <header :class="$style.header">
      <p :class="$style.eyebrow">Бронирование</p>
      <h1 id="booking-title" :class="$style.title">Забронируйте столик</h1>
      <p :class="$style.subtitle">Заполните форму — мы сохраним столик за вами.</p>
    </header>

    <form ref="formElement" :class="$style.form" novalidate @submit.prevent="handleSubmit">
      <fieldset :class="$style.fieldset" :disabled="isLoading">
        <div :class="$style.field">
          <label for="name" :class="$style.label">Имя <span aria-hidden="true">*</span></label>
          <input
            id="name"
            v-model="form.name"
            :class="[$style.control, errors.name && $style.controlError]"
            type="text"
            name="name"
            autocomplete="name"
            placeholder="Анна"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errorId('name')"
            @blur="validateField('name')"
            @input="revalidateIfTouched('name')"
          />
          <p v-if="errors.name" id="name-error" :class="$style.error" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <div :class="$style.field">
          <label for="phone" :class="$style.label">Телефон <span aria-hidden="true">*</span></label>
          <input
            id="phone"
            v-model="form.phone"
            :class="[$style.control, errors.phone && $style.controlError]"
            type="tel"
            name="phone"
            autocomplete="tel"
            inputmode="tel"
            placeholder="+7 (999) 123-45-67"
            :aria-invalid="Boolean(errors.phone)"
            :aria-describedby="errorId('phone')"
            @blur="validateField('phone')"
            @input="revalidateIfTouched('phone')"
          />
          <p v-if="errors.phone" id="phone-error" :class="$style.error" role="alert">
            {{ errors.phone }}
          </p>
        </div>

        <div :class="$style.row">
          <div :class="$style.field">
            <label for="date" :class="$style.label">Дата <span aria-hidden="true">*</span></label>
            <input
              id="date"
              v-model="form.date"
              :class="[$style.control, errors.date && $style.controlError]"
              type="date"
              name="date"
              :min="dateRange.min"
              :max="dateRange.max"
              :aria-invalid="Boolean(errors.date)"
              :aria-describedby="errorId('date')"
              @blur="validateField('date')"
              @input="revalidateIfTouched('date')"
            />
            <p v-if="errors.date" id="date-error" :class="$style.error" role="alert">
              {{ errors.date }}
            </p>
          </div>

          <div :class="$style.field">
            <p :class="$style.labelHint">Доступно на 90 дней вперёд</p>
            <div :class="$style.dateHint" aria-hidden="true">
              <span :class="$style.dateHintDot" />
              Бронирование без предоплаты
            </div>
          </div>
        </div>

        <div :class="$style.field">
          <div id="time-label" :class="$style.label">Время <span aria-hidden="true">*</span></div>
          <div
            :class="[$style.timeGrid, errors.time && $style.timeGridError]"
            role="radiogroup"
            aria-labelledby="time-label"
            :aria-describedby="errorId('time')"
          >
            <label v-for="slot in TIME_SLOTS" :key="slot" :class="$style.timeSlot">
              <input
                v-model="form.time"
                type="radio"
                name="time"
                :value="slot"
                :aria-invalid="Boolean(errors.time)"
                @blur="validateField('time')"
                @change="revalidateIfTouched('time')"
              />
              <span>{{ slot }}</span>
            </label>
          </div>
          <p v-if="errors.time" id="time-error" :class="$style.error" role="alert">
            {{ errors.time }}
          </p>
        </div>

        <div :class="[$style.field, $style.guestField]">
          <div>
            <label for="guests" :class="$style.label">
              Количество гостей <span aria-hidden="true">*</span>
            </label>
            <p :class="$style.helper">От 1 до 12 человек</p>
          </div>

          <div :class="[$style.stepper, errors.guests && $style.stepperError]">
            <button
              type="button"
              aria-label="Уменьшить количество гостей"
              :disabled="form.guests <= 1"
              @click="changeGuests(-1)"
            >
              <span aria-hidden="true">−</span>
            </button>
            <input
              id="guests"
              v-model.number="form.guests"
              type="number"
              name="guests"
              min="1"
              max="12"
              readonly
              :aria-invalid="Boolean(errors.guests)"
              :aria-describedby="errorId('guests')"
              @blur="validateField('guests')"
            />
            <button
              type="button"
              aria-label="Увеличить количество гостей"
              :disabled="form.guests >= 12"
              @click="changeGuests(1)"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <p v-if="errors.guests" id="guests-error" :class="$style.error" role="alert">
            {{ errors.guests }}
          </p>
        </div>
      </fieldset>

      <button :class="$style.submit" type="submit" :disabled="isLoading">
        <span v-if="isLoading" :class="$style.spinner" aria-hidden="true" />
        <span>{{ isLoading ? 'Бронирую...' : 'Забронировать столик' }}</span>
      </button>
    </form>
  </section>
</template>

<style module lang="scss" src="./BookingForm.module.scss"></style>
