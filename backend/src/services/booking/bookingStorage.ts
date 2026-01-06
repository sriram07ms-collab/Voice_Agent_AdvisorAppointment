import * as fs from 'fs';
import * as path from 'path';
import { Booking } from '../../shared/types/conversation';

// Use absolute path from project root
const BOOKINGS_FILE = path.resolve(process.cwd(), 'backend', 'data', 'bookings.json');

// Ensure data directory exists
const dataDir = path.dirname(BOOKINGS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load bookings from file
function loadBookings(): Map<string, Booking> {
  if (!fs.existsSync(BOOKINGS_FILE)) {
    return new Map();
  }
  
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    const bookingsArray: Booking[] = JSON.parse(data);
    const bookingsMap = new Map<string, Booking>();
    
    for (const booking of bookingsArray) {
      // Convert date strings back to Date objects
      booking.createdAt = new Date(booking.createdAt);
      booking.updatedAt = new Date(booking.updatedAt);
      if (booking.preferredDate) {
        booking.preferredDate = new Date(booking.preferredDate);
      }
      if (booking.expiresAt) {
        booking.expiresAt = new Date(booking.expiresAt);
      }
      if (booking.selectedSlot) {
        booking.selectedSlot.startTime = new Date(booking.selectedSlot.startTime);
        booking.selectedSlot.endTime = new Date(booking.selectedSlot.endTime);
      }
      
      bookingsMap.set(booking.id, booking);
    }
    
    return bookingsMap;
  } catch (error) {
    console.error('Error loading bookings from file:', error);
    return new Map();
  }
}

// Save bookings to file
function saveBookings(bookings: Map<string, Booking>): void {
  try {
    const bookingsArray = Array.from(bookings.values());
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving bookings to file:', error);
  }
}

// Initialize bookings from file
let bookings: Map<string, Booking> = loadBookings();
let bookingsByCode: Map<string, Booking> = new Map();

// Build bookingsByCode index
for (const booking of bookings.values()) {
  bookingsByCode.set(booking.bookingCode, booking);
}

export function getBookings(): Map<string, Booking> {
  return bookings;
}

export function getBookingsByCode(): Map<string, Booking> {
  return bookingsByCode;
}

export function addBooking(booking: Booking): void {
  bookings.set(booking.id, booking);
  bookingsByCode.set(booking.bookingCode, booking);
  saveBookings(bookings);
}

export function updateBooking(booking: Booking): void {
  bookings.set(booking.id, booking);
  bookingsByCode.set(booking.bookingCode, booking);
  saveBookings(bookings);
}

export function removeBooking(bookingId: string): void {
  const booking = bookings.get(bookingId);
  if (booking) {
    bookings.delete(bookingId);
    bookingsByCode.delete(booking.bookingCode);
    saveBookings(bookings);
  }
}

