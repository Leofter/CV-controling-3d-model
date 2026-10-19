#!/usr/bin/env bash
# Unified lifecycle command for e-Agro 3D Studio.
# Usage: ./eagro.sh {start|stop|status}

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$PROJECT_ROOT/backend"
RUNTIME_ROOT="$PROJECT_ROOT/.runtime"
VENV_ROOT="$BACKEND_ROOT/.venv"
PID_FILE="$RUNTIME_ROOT/eagro.pid"
LOG_FILE="$RUNTIME_ROOT/eagro.log"
PORT="${EAGRO_PORT:-8080}"
PYTHON_COMMAND="${PYTHON_COMMAND:-python3}"

is_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(<"$PID_FILE")" 2>/dev/null
}

ensure_environment() {
  if [[ ! -x "$VENV_ROOT/bin/python" ]]; then
    echo "Criando ambiente Python isolado..."
    "$PYTHON_COMMAND" -m venv "$VENV_ROOT"
  fi

  if ! "$VENV_ROOT/bin/python" -c 'import fastapi, multipart, numpy, PIL, rembg, trimesh, uvicorn' 2>/dev/null; then
    echo "Instalando dependências do backend (somente nesta primeira execução)..."
    "$VENV_ROOT/bin/python" -m pip install --upgrade pip
    "$VENV_ROOT/bin/python" -m pip install -r "$BACKEND_ROOT/requirements.txt"
  fi
}

wait_until_ready() {
  local attempt
  for attempt in {1..40}; do
    if "$VENV_ROOT/bin/python" -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:${PORT}/health', timeout=0.25)" 2>/dev/null; then
      return 0
    fi
    if ! is_running; then
      echo "Falha ao iniciar o servidor. Últimas mensagens:" >&2
      tail -n 30 "$LOG_FILE" >&2 || true
      return 1
    fi
    sleep 0.25
  done
  echo "O processo iniciou, mas não respondeu em http://127.0.0.1:${PORT}/health." >&2
  return 1
}

start() {
  mkdir -p "$RUNTIME_ROOT"
  if is_running; then
    echo "e-Agro 3D Studio já está em execução: http://127.0.0.1:${PORT} (PID $(<"$PID_FILE"))."
    return 0
  fi
  rm -f "$PID_FILE"
  ensure_environment

  echo "Iniciando backend e frontend no mesmo servidor..."
  (
    cd "$BACKEND_ROOT"
    nohup "$VENV_ROOT/bin/python" -m uvicorn src.presentation.api.main:app --host 127.0.0.1 --port "$PORT" \
      </dev/null >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )

  if wait_until_ready; then
    echo "Pronto: http://127.0.0.1:${PORT}"
    echo "Log: $LOG_FILE"
  else
    stop || true
    return 1
  fi
}

stop() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "e-Agro 3D Studio não está em execução."
    return 0
  fi

  local pid
  pid="$(<"$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "Encerrando e-Agro 3D Studio (PID $pid)..."
    kill -TERM "$pid"
    local attempt
    for attempt in {1..20}; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    if kill -0 "$pid" 2>/dev/null; then
      echo "Encerramento normal excedeu o limite; finalizando o processo." >&2
      kill -KILL "$pid"
    fi
  fi
  rm -f "$PID_FILE"
  echo "Programa encerrado por completo."
}

status() {
  if is_running; then
    echo "Em execução: http://127.0.0.1:${PORT} (PID $(<"$PID_FILE"))."
  else
    rm -f "$PID_FILE"
    echo "Parado."
  fi
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *)
    echo "Uso: ./eagro.sh {start|stop|status}" >&2
    exit 64
    ;;
esac
