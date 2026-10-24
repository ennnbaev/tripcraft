import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClass, type ButtonStyle } from './buttonClass'

type ButtonProps = ButtonStyle & ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }

export default function Button({ variant, size, icon, block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, icon, block }, className)} {...rest} />
}

type ButtonLinkProps = ButtonStyle & LinkProps

/** A router link that looks like a button. */
export function ButtonLink({ variant, size, icon, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, icon, block }, className)} {...rest} />
}
