#!/bin/bash

echo "🚀 Configurando entorno Python para Firebase Functions..."

# Instalar dependencias Python localmente
cd python
pip3 install --target . -r requirements.txt

# Crear __init__.py si no existe
touch __init__.py

echo "✅ Dependencias Python instaladas"
echo "📌 Asegúrate de copiar la carpeta 'qinterpreter' dentro de functions/python/"