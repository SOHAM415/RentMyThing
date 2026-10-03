CREATE TABLE IF NOT EXISTS booking_messages (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL
    REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL
    CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking
  ON booking_messages(booking_id, created_at);

CREATE TABLE IF NOT EXISTS booking_handoffs (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER UNIQUE NOT NULL
    REFERENCES bookings(id) ON DELETE CASCADE,
  pickup_location TEXT,
  pickup_time TEXT,
  instructions TEXT,
  handoff_code VARCHAR(6) NOT NULL,
  verified_at TIMESTAMP
);
