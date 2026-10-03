# RentMyThing — AI-Powered Rental Marketplace

Recruiter-ready full-stack MVP built with React, Node.js/Express, PostgreSQL, Razorpay, Docker Compose and an Ollama-compatible AI assistant.

## Features
- JWT authentication
- Rental listings and search
- Date-based bookings
- Razorpay order creation + signature verification
- Payment records and idempotent verification
- AI assistant with live inventory context
- PostgreSQL + Redis-ready architecture
- Docker Compose for frontend/backend/database

## Local setup
1. Copy `backend/.env.example` to `backend/.env` and fill credentials.
2. Copy `frontend/.env.example` to `frontend/.env` and add the Razorpay public key.
3. Run the backend and frontend with npm, or use Docker Compose.

## AI
The backend uses an Ollama-compatible local endpoint by default. Run Ollama separately and set `OLLAMA_MODEL` to an installed model. The app still returns a useful fallback if the AI provider is unavailable.

## Security
Do not commit secrets. The original archive contained credentials; rotate those credentials before using this project publicly.
