#!/bin/bash

echo "🛑 Parando processos Node.js na porta 3001..."
# Tenta matar processos node
taskkill //F //IM node.exe 2>/dev/null || echo "Nenhum processo Node encontrado"

echo "⏳ Aguardando 2 segundos..."
sleep 2

echo "🚀 Iniciando bot..."
npm run start:n8n
