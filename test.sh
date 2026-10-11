#!/bin/bash
echo "Test 1 - Ollama direct..."
curl -s http://172.17.0.2:11434/api/tags | grep qwen && echo "✅ Ollama OK" || echo "❌ Ollama KO"

echo "Test 2 - Backend generate..."
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "x-model: qwen2.5-coder:7b" \
  -d '{"prompt":"say hi","files":{}}' \
  --max-time 30 | grep token && echo "✅ Backend OK" || echo "❌ Backend KO"

echo "Test 3 - Frontend..."
curl -s http://localhost:3000 | grep "X-KERNEL" && echo "✅ Frontend OK" || echo "❌ Frontend KO"
