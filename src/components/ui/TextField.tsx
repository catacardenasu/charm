import { useId, useState, type ChangeEvent, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'
import { cx } from './cx.ts'
import { SPRITES } from './sprites.ts'

/** md = Log In fields (20px text). lg = onboarding fields (24px text). */
export type TextFieldSize = 'md' | 'lg'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Shown above the field (Nickname, Major, Greeting). Also used as the accessible name. */
  label: string
  /** Hide the visible label and keep it for screen readers (Log In fields use the placeholder). */
  hideLabel?: boolean
  size?: TextFieldSize
  /** Shows "18 out of 30 characters" under the field. Needs maxLength. */
  showCount?: boolean
}

export function TextField({
  label,
  hideLabel = false,
  size = 'lg',
  showCount = false,
  type = 'text',
  id,
  className,
  value,
  defaultValue,
  maxLength,
  onChange,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const countId = `${inputId}-count`
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)
  const [uncontrolledLength, setUncontrolledLength] = useState(String(defaultValue ?? '').length)
  const length = value != null ? String(value).length : uncontrolledLength

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUncontrolledLength(event.target.value.length)
    onChange?.(event)
  }

  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && styles.visuallyHidden)}>
        {label}
      </label>
      <div className={cx(styles.field, styles[size], rest.disabled && styles.disabled)}>
        <input
          id={inputId}
          className={styles.input}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          aria-describedby={showCount ? countId : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.eye}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            disabled={rest.disabled}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            <img src={showPassword ? SPRITES.eyeOff : SPRITES.eye} alt="" />
          </button>
        )}
      </div>
      {showCount && maxLength != null && (
        <p id={countId} className={styles.count}>
          {length} out of {maxLength} characters
        </p>
      )}
    </div>
  )
}
