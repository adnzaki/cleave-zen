import type { FormatNumeralRequiredProps, FormatNumeralOptions } from './types'

import {
  DefaultNumeralDecimalMark,
  DefaultNumeralDelimiter,
  DefaultNumeralThousandGroupStyle,
  DefaultNumeralDecimalScale,
  DefaultNumeralIntegerScale,
  NumeralThousandGroupStyles,
} from './constants'

const format = ({
  value,
  delimiter,
  numeralDecimalMark,
  numeralDecimalScale,
  stripLeadingZeroes,
  numeralPositiveOnly,
  numeralIntegerScale,
  numeralThousandsGroupStyle,
  signBeforePrefix,
  tailPrefix,
  prefix,
  allowArithmetic,
}: FormatNumeralRequiredProps): string => {
  let parts: string[]
  let partSignAndPrefix: string
  let partInteger: string
  let partDecimal: string = ''
  const stripNumeric = allowArithmetic ? /[^\d+\-*/M]/g : /[^\dM-]/g

  // strip alphabet letters
  let result: string = value
    .replace(/[A-Za-z]/g, '')

    // replace the first decimal mark with reserved placeholder
    .replace(numeralDecimalMark, 'M')

    // strip non numeric letters except minus and "M"
    // this is to ensure prefix has been stripped
    .replace(stripNumeric, '')

    // replace the leading minus with reserved placeholder
    .replace(/^-/, 'N')

    // strip the other minus sign (if present)
    .replace(allowArithmetic ? '' : /-/g, '')

    // replace the minus sign (if present)
    .replace('N', numeralPositiveOnly ?? false ? '' : '-')

    // replace decimal mark
    .replace('M', numeralDecimalMark)

  // strip any leading zeros
  if (stripLeadingZeroes) {
    result = result.replace(/^(-)?0+(?=\d)/, '$1')
  }

  const partSign: string = result.slice(0, 1) === '-' ? '-' : ''

  if (signBeforePrefix) {
    partSignAndPrefix = partSign + prefix
  } else {
    partSignAndPrefix = prefix + partSign
  }

  partInteger = result

  if (result.includes(numeralDecimalMark)) {
    parts = result.split(numeralDecimalMark)
    partInteger = parts[0]
    partDecimal = numeralDecimalMark + parts[1].slice(0, numeralDecimalScale)
  }

  if (partSign === '-') {
    partInteger = partInteger.slice(1)
  }

  if (numeralIntegerScale > 0) {
    partInteger = partInteger.slice(0, numeralIntegerScale)
  }

  const formatThousandStyle = () => {
    if(allowArithmetic) {
      // clean up double operators
      partInteger = partInteger.replace(/([+\-*/]){2,}/g, match =>
        match.slice(-1)
      )

      partInteger = partInteger.split(/([+\-*/])/).map(token => {
        const clean = token.replace(/[^0-9]/g, '');
        if (!clean) return token; // jika token adalah operator atau kosong, biarkan
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter); // format angka
      }).join('');
    } else {
      partInteger = partInteger.replace(/(\d)(?=(\d{3})+$)/g, '$1' + delimiter)
    }
  }

  switch (numeralThousandsGroupStyle) {
    case NumeralThousandGroupStyles.LAKH:
      partInteger = partInteger.replace(/(\d)(?=(\d\d)+\d$)/g, '$1' + delimiter)
      break

    case NumeralThousandGroupStyles.WAN:
      partInteger = partInteger.replace(/(\d)(?=(\d{4})+$)/g, '$1' + delimiter)
      break

    case NumeralThousandGroupStyles.THOUSAND:
      formatThousandStyle()
      break
  }

  if (tailPrefix) {
    return (
      partSign +
      partInteger +
      (numeralDecimalScale > 0 ? partDecimal : '') +
      prefix
    )
  }

  return (
    partSignAndPrefix +
    partInteger +
    (numeralDecimalScale > 0 ? partDecimal : '')
  )
}

export const formatNumeral = (
  value: string,
  options?: FormatNumeralOptions
): string => {
  const {
    delimiter = DefaultNumeralDelimiter,
    numeralThousandsGroupStyle = DefaultNumeralThousandGroupStyle,
    numeralIntegerScale = DefaultNumeralIntegerScale,
    numeralDecimalMark = DefaultNumeralDecimalMark,
    numeralDecimalScale = DefaultNumeralDecimalScale,
    stripLeadingZeroes = true,
    numeralPositiveOnly = false,
    tailPrefix = false,
    signBeforePrefix = false,
    prefix = '',
    allowArithmetic = false,
  } = options ?? {}

  value = format({
    value,
    delimiter,
    numeralIntegerScale,
    numeralDecimalMark,
    numeralDecimalScale,
    stripLeadingZeroes,
    numeralPositiveOnly,
    numeralThousandsGroupStyle,
    tailPrefix,
    signBeforePrefix,
    prefix,
    allowArithmetic,
  })

  return value
}

export const unformatNumeral = (
  value: string,
  options?: Pick<FormatNumeralOptions, 'numeralDecimalMark'>
): string => {
  const { numeralDecimalMark = DefaultNumeralDecimalMark } = options ?? {}

  return value
    .replace(numeralDecimalMark, 'M')
    .replace(/[^0-9-M]/g, '')
    .replace('M', '.')
}
