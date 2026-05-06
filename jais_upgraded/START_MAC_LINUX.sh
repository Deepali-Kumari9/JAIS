#!/bin/bash
echo "Starting JAIS Backend..."
cd backend
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!
cd ..

echo "Starting JAIS Frontend..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "JAIS Running!"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
wait
