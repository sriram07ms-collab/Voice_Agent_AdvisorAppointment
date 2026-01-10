export function generateBookingCode(): string {
  // Format: NL-{Letter}{3 digits}
  // Example: NL-A742
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const digits = Math.floor(100 + Math.random() * 900); // 100-999
  
  return `NL-${letter}${digits}`;
}

export function validateBookingCode(code: string): boolean {
  // Format: NL-{Letter}{3 digits}
  const pattern = /^NL-[A-Z]\d{3}$/;
  return pattern.test(code);
}













