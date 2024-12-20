export function removeTelephoneMask(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  return value.replace(/\D/g, '');
}

export function formatLandline(value: string | null | undefined): string {
  const cleanedValue = removeTelephoneMask(value);
  
  if (cleanedValue.length === 10) {
    return cleanedValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return cleanedValue;
  }
}

export function formatCellphone(value: string | null | undefined): string {
  const cleanedValue = removeTelephoneMask(value);
  
  if (cleanedValue.length === 11) {
    return cleanedValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else {
    return cleanedValue;
  }
}

export function formatPhoneNumber(value: string | null | undefined): string {
  const cleanedValue = removeTelephoneMask(value);
  
  if (cleanedValue.length === 10) {
    return formatLandline(cleanedValue);
  } else if (cleanedValue.length === 11) {
    return formatCellphone(cleanedValue);
  } else {
    return cleanedValue;
  }
}
