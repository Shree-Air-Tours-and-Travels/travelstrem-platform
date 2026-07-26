Plan: Unified Production Booking Flow
Architecture Overview
Two flows, one system. A unified BookingEngineController uses the existing product field to branch behavior. The Booking model already has all the fields needed — we just wire the flows properly.
TREVIO (Trips):  Select → Customise → Submit → Checkout → Token Pay → Done → Dashboard
TREVISTA (Tours): Select → Customise → Submit → Checkout → Quote → Agent Assigned → Chat → Quote Update → Pay → Accept → Complete → Dashboard